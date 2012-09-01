(ns helloworld.graph
  (:require [helloworld.canvas :as c]
            [clojure.string :as s]))

(defn move [context x y] (.moveTo context x y))
(defn line [context x y] (.lineTo context x y))
(defn arc [context x y r s e ccw] (.arc context x y r (* Math/PI s) (* Math/PI e) ccw))
(defn split [context] (doto context (.stroke) (.beginPath)))

(def figure {\h [1 0 0 0 0
                 1 0 0 0 0
                 1 0 0 0 0
                 1 0 1 1 0
                 1 1 0 0 1
                 1 0 0 0 1
                 1 0 0 0 1]})

(def unknown [0 1 1 1 0
              1 0 0 0 1
              0 0 0 0 1
              0 0 0 1 0
              0 0 1 0 0
              0 0 0 0 0
              0 0 1 0 0])

(defn draw-figure [context pixels]
  (dorun
    (for [y (range 7) x (range 5)]
      (arc context (* x 25) (* y 25) 20 0 2 true))))

(defn draw-line [context [c & r]]
  (doto context
    (.beginPath)
    (draw-figure (get figure c unknown))
    (.stroke))
  (when r
    (.translate context 250 0)
    (draw-line context r)))

(defn draw-text [context x y [line & r]]
  (doto context
    (.setTransform 1 0 0 1 x y)
    (draw-line line))
  (when r
    (draw-text context x (+ y 250) r)))

(defn ^:export draw [text]
  (let [c (c/get-context)]
    (c/set-line! c "#005000" 10)
    (draw-text c 150 150 (s/split-lines text))
    (c/set-line! c "#00FF00" 2)
    (draw-text c 150 150 (s/split-lines text))))
