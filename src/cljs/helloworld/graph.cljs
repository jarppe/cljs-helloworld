(ns helloworld.graph)

(def line-height 250)

(defn line [context x1 y1 x2 y2]
  (doto context
    (.beginPath)
    (.moveTo x1 y1)
    (.lineTo x2 y2)
    (.stroke)))

(defn arc [context x y r s e]
  (doto context
    (.beginPath)
    (.arc x y r (* Math/PI s) (* Math/PI e) true)
    (.stroke)))

(def figure {\h [[arc 0 0 100 0.35 1.65]
                 [arc 0 0 100 1.35 0.65]
                 [line -100 0 100 0]]
             \e [[arc 0 0 100 1.75 0.25]
                 [line -100 0 50 0]]
             \l [[arc 0 0 100 1.5 0.25]]
             \o [[arc 0 0 100 0 2]]
             \w [[arc 0 0 100 0.35 1.65]
                 [arc 0 0 100 1.35 0.65]
                 [arc -50 38 50 0.48 0]
                 [arc 50 38 50 1 0.52]]
             \r [[line -70 -87 -70 100]
                 [arc -30 -30 70 0.7 1.3]
                 [line -15 37 30 100]]
             \d [[line -30 -95 -30 95]
                 [arc 0 0 100 0.7 1.3]]})

(def unknown [[line -100 -100 100  100]
              [line -100  100 100 -100]])

(defn draw-figure [context [[op & args] & r]]
  (apply op context args)
  (when r
    (draw-figure context r)))

(defn draw-line [context [c & r]]
  (draw-figure context (get figure c unknown))
  (when r
    (.translate context 250 0)
    (draw-line context r)))

(defn draw-text [context x y [line & r]]
  (doto context
    (.setTransform 1 0 0 1 x y)
    (draw-line line))
  (when r
    (draw-text context x (+ y line-height) r)))
