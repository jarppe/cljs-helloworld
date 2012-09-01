(ns helloworld.graph
  (:require [helloworld.canvas :as c]
            [clojure.string :as s]))

(defn move [context x y] (.moveTo context x y))
(defn line [context x y] (.lineTo context x y))
(defn arc [context x y r s e ccw] (.arc context x y r (* Math/PI s) (* Math/PI e) ccw))
(defn split [context] (doto context (.stroke) (.beginPath)))

(def figure {\h [[arc 0 0 100 0.35 1.65 true] [split] [arc 0 0 100 1.35 0.65 true] [move -100 0] [line 100 0]]
             \e [[arc 0 0 100 1.75 0.25 true] [move -100 0] [line 50 0]]
             \l [[arc 0 0 100 1.3 0.25 true]]
             \o [[arc 0 0 100 0 2 true]]
             \w [[arc 0 0 100 1.35 0.65 true] [line 0 50] [arc 0 0 100 0.35 1.65 true]]
             \r [[arc -30 -30 70 0.7 1.3 true] [move -70 -87] [line -70 100] [move -15 37] [line 30 100]]
             \d [[arc 0 0 100 0.7 1.3 true] [move -30 -95] [line -30 95]]})

(def unknown [[arc 0 0 40 0 2 true]])

(defn draw-figure [context [[op & args] & r]]
  (apply op context args)
  (if r
    (draw-figure context r)))

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
