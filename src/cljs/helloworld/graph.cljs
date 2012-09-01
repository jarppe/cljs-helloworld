(ns helloworld.graph
  (:require [helloworld.canvas :as c]
            [helloworld.figure :as f]
            [clojure.string :as s]))

(defn make-fill [context]
  (doto (.createRadialGradient context 0 0 0 0 0 20)
    (.addColorStop 0 "rgba(255,255,0,255)")
    (.addColorStop 1 "rgba(200,200,0,0)")))

(defn draw-figure [context fx fy pixels]
  (dorun
    (for [y (range 8) x (range 5) :when (= (get pixels (+ x (* y 5))) 1)]
      (doto context
        (.setTransform 1 0 0 1 (+ fx (* x 20)) (+ fy (* y 20)))
        (c/set-fill! (make-fill context))
        (.fillRect -30 -30 60 60)))))

(defn draw-line [context x y [c & r]]
  (draw-figure context x y (f/get-figure c))
  (when r
    (draw-line context (+ x 120) y r)))

(defn draw-text [context x y [line & r]]
  (draw-line context x y line)
  (when r
    (draw-text context x (+ y 180) r)))

(defn ^:export draw [x y text]
  (draw-text (c/get-context) x y (s/split-lines text)))
