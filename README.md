# helloworld

A simple "hello world" experiment with ClojureScript and HTML5 canvas.

Originally designed for registration test to [Reaktor Dev Days 2012](http://reaktordevday.fi/2012/).

## Usage

You need [lein](https://github.com/technomancy/leiningen), a browser with HTML5 canvas support, and optionally a [growlnotify](http://growl.info/extras.php#growlnotify) application. I use growl to notify me when compilations are done, but if you don't have `growlnotify` just remove text `:notify-command ["growlnotify" "-m"]` from `project.clj` file. Leave the rest of the line intact.

To build type:

	$ lein cljsbuild once

That starts ClojureScript compiler that compiles ClojureScript sources to Javascript. If you change the `once` to `auto` then the compiler will keep on running and execute the compilation every time you change any of the source files. For more information see [lein-cljsbuild](https://github.com/emezeske/lein-cljsbuild).

Build is ready when you see a line like this:

	Successfully compiled "resources/public/hello.js" in 1.221249 seconds.

Open the file `./resources/public/hello.html` in your browser. If you are on a Mac you can just type:

	$ open ./resources/public/hello.html

The HTML is just a simple page that creates a HTML5 canvas with the same size as the page, loads the Javascript file compiled by the ClojureScript compiler and calls a method in that script. The script will then draw the text "hello world" using lines and arcs.

## License

Copyright © 2012 Jarppe Länsiö

Distributed under the Eclipse Public License, the same as Clojure.
