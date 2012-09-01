(ns helloworld.canvas
  (:use [clojure.string :only [join]]))

(defn log [& msg]
  (.log js/console (join " " msg)))

(defn get-canvas []
  (let [canvas (.getElementById js/document "canvas")]
    (set! (.-width canvas) (.-width js/document))
    (set! (.-height canvas) (.-height js/document))
    (set! js/canvasW (.-width canvas))
    (set! js/heightW (.-height canvas))
    canvas))

(defn get-context []
  (let [context (.getContext (get-canvas) "2d")]
    (set! (.-strokeStyle context) "#00FF00")
    (set! (.-lineWidth context) 2)
    (set! (.-lineCap context) "butt")
    context))
