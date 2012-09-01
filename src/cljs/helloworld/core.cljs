(ns helloworld.core
  (:use [clojure.string :only [split-lines]])
  (:require [helloworld.graph :as g]
            [helloworld.canvas :as c]))

(defn ^:export main []
  (g/draw-text (c/get-context) 150 150 (split-lines "hello\nworld")))
