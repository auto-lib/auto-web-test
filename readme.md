# auto web test

the idea here is:

 - launch an http server
 - connect with browser
 - interact with controls
 - watch changes to auto objects

so you can interact with your app
and then save a snapshot of behaviour
and then for any future changes you
can check if this behavior has
changed or not.

of course there are a lot of caveats:

## 1. how do we store the behavior?

well with auto all changes are done
through static variables.

```js
auto({
    x: 0,
    y: _ => _.x * 2
})
```

so in the above case you can only
change `x` through the ui. then
for this change we record what
happened, namely `y` changed.

since this is javascript it's
single threaded and thus each change
results in a set of changes:

```js
let changes = {
    [
        var: 'x',
        value: 20,
        result: {
            y: 40
        }
    ]
}
```

## what about the size of the test file?

we will need to specify which variables
to keep changes for. in fact, we should
have a separate process for recording
inputs and then deciding on which changes
to record. we can use _jsdom_ to run the
outputs from the command line and give
an output of how big the state snapshot
will be.

```bash
$ node sizes.js
counting outputs
result for 12 tests: {
    y: '23 changes, 34kB',
    z: '1 change, 1 byte'
}
```

since a change could be a huge array
or just a number we need to show the
actual size of the data too.

### debouncing

we will need to debounce inputs as
well. perhaps globally - just give
some global number like 100ms.
would be worth having a console
output during testing showing each
change that is being recorded:

```bash
$ node record.js
starting server at localhost:8080
debouncing by 100ms
writing to out/inputs.json
got /
x changed
x changed
x changed
```

## input cache with hashing

ostensibly we don't need any way to
initialise state: all changes will
be recorded as inputs (auto is
literally just input/output by design).

however, again what about size - what
if you have a large input file. it
has to be processed by auto, assuming
you are using auto for everything.

and what if we need to use the same
input file for several tests?

we could use a caching policy - 
this means we need to serialise
the input somehow ... get a hash
for it, and then figure out each
time whether we have a clash ...

is there a generic way to serialise
javascript variables? `JSON.stringify()`
seems like the way to go
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify

i suppose we have to do this anyway.

## reversable parse

if we are going to use `JSON.stringify()`
then we have to use `JSON.parse`.

we should check each time whether
for each stringify we can parse
back and get the same value.

## cache path

```bash
$ node record.js
starting server at localhost:8080
debouncing by 100ms
writing to out/inputs.json
writing >100 bytes to out/cache.json
got /
data changed. 2kB. not in cache. saving
rates changed. 5kB. in cache
x changed
x changed
x changed
```

```js
let cache = {
    'd131dd02c5e6eec4': []
}
```

```js
let changes = [
    {
        var: 'data',
        cache: 'd131dd02c5e6eec4',
        result: {
            y: 100,
            z: 'hello'
        }
    },
    {
        var: 'x',
        value: 20,
        result: {
            y: 40
        }
    }
]
```

## confirm md5

we should be confirming the md5 for each
item in the cache at some point. at the
start of running `sizes.js`?

```js
$ node sizes.js
confirming cache md5s
no cache found
```

or

```js
$ node sizes.js
confirming cache md5s
cache empty
```

or

```js
$ node sizes.js
confirming cache md5s
3 items in cache (100kB total)
all passed md5
```

or

```js
$ node sizes.js
confirming cache md5s
3 items in cache (100kB total)
d131dd02c5e6eec4 fail
d131dd02c7e6eec4 passed
d13ddd02c5e6eec4 passed
run cache.js clean to delete bad entries
exiting
```

> should i just print them all out?
> arrgh

## cleaning cache

delete items failing in cache
(how to we diagnose this?)

```js
$ node clean.js
3 items in cache (100kB total)
d131dd02c5e6eec4 fail - DELETED
d131dd02c7e6eec4 passed
d13ddd02c5e6eec4 passed
```
