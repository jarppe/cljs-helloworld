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

(defn set-line! [context style width]
  (set! (.-strokeStyle context) style)
  (set! (.-lineWidth context) width)
  context)

(defn set-fill! [context style]
  (set! (.-fillStyle context) style))

(defn get-context []
  (let [context (.getContext (get-canvas) "2d")]
    (set! (.-lineCap context) "round")
    (set-line! context "#00FF00" 2)
    context))

