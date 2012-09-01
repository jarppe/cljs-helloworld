(defproject helloworld "0.1.0-SNAPSHOT"
  :description "HelloWorld - with ClojureScript"
  :plugins [[lein-cljsbuild "0.2.7"]
            [lein-pedantic "0.0.2"]]
  :dependencies [[org.clojure/clojure "1.4.0"]]
  :source-path "src/clj"
  :cljsbuild {:builds {:main {:source-path "src/cljs"
                              :compiler {:output-to "resources/public/hello.js"
                                         :optimizations :whitespace
                                         :pretty-print true
                                         :print-input-delimiter true}
                              :notify-command ["growlnotify" "-m"]}}}) 
