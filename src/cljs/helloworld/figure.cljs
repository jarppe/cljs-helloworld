(ns helloworld.figure)

(def figure
  {\h [1 0 0 0 0
       1 0 0 0 0
       1 0 0 0 0
       1 0 1 1 0
       1 1 0 0 1
       1 0 0 0 1
       1 0 0 0 1
       0 0 0 0 0]
   \e [0 0 0 0 0
       0 0 0 0 0
       0 1 1 1 0
       1 0 0 0 1
       1 1 1 1 1
       1 0 0 0 0
       0 1 1 1 0
       0 0 0 0 0]
   \l [0 1 1 0 0
       0 0 1 0 0
       0 0 1 0 0
       0 0 1 0 0
       0 0 1 0 0
       0 0 1 0 0
       0 1 1 1 0
       0 0 0 0 0]
   \t [0 0 1 0 0
       0 0 1 0 0
       0 1 1 1 0
       0 0 1 0 0
       0 0 1 0 0
       0 0 1 0 0
       0 0 1 1 0
       0 0 0 0 0]
   \o [0 0 0 0 0
       0 0 0 0 0
       0 1 1 1 0
       1 0 0 0 1
       1 0 0 0 1
       1 0 0 0 1
       0 1 1 1 0
       0 0 0 0 0]
   \w [0 0 0 0 0
       0 0 0 0 0
       1 0 0 0 1
       1 0 0 0 1
       1 0 0 0 1
       1 0 1 0 1
       0 1 0 1 0
       0 0 0 0 0]
   \r [0 0 0 0 0
       0 0 0 0 0
       0 1 0 1 0
       0 1 1 0 0
       0 1 0 0 0
       0 1 0 0 0
       0 1 0 0 0
       0 0 0 0 0]
   \d [0 0 0 0 1
       0 0 0 0 1
       0 1 1 0 1
       1 0 0 1 1
       1 0 0 0 1
       1 0 0 1 1
       0 1 1 0 1
       0 0 0 0 0]
   \m [0 0 0 0 0
       0 0 0 0 0
       1 1 0 1 0
       1 0 1 0 1
       1 0 1 0 1
       1 0 1 0 1
       1 0 1 0 1
       0 0 0 0 0]
   \s [0 0 0 0 0
       0 0 0 0 0
       0 1 1 1 0
       1 0 0 0 0
       0 1 1 1 0
       0 0 0 0 1
       0 1 1 1 0
       0 0 0 0 0]
   \i [0 0 1 0 0
       0 0 0 0 0
       0 0 1 1 0
       0 0 1 0 0
       0 0 1 0 0
       0 0 1 0 0
       0 1 1 1 0
       0 0 0 0 0]
   \n [0 0 0 0 0
       0 0 0 0 0
       1 0 1 0 0
       1 1 0 1 0
       1 0 0 1 0
       1 0 0 1 0
       1 0 0 1 0
       0 0 0 0 0]
   \u [0 0 0 0 0
       0 0 0 0 0
       1 0 0 1 0
       1 0 0 1 0
       1 0 0 1 0
       1 0 0 1 0
       0 1 1 0 1
       0 0 0 0 0]
   \! [0 0 0 0 0
       0 0 1 0 0
       0 0 1 0 0
       0 0 1 0 0
       0 0 1 0 0
       0 0 0 0 0
       0 0 1 0 0
       0 0 0 0 0]
   \z [0 0 0 0 0
       0 0 0 0 0
       1 1 1 1 1
       0 0 0 1 0
       0 0 1 0 0
       0 1 0 0 0
       1 1 1 1 1
       0 0 0 0 0]
   \j [0 0 0 1 0
       0 0 0 0 0
       0 1 1 1 0
       0 0 0 1 0
       0 0 0 1 0
       0 0 0 1 0
       0 0 0 1 0
       0 1 1 0 0]
   \a [0 0 0 0 0
       0 0 0 0 0
       0 0 1 1 0
       0 1 0 0 1
       0 0 1 1 1
       0 1 0 0 1
       0 0 1 1 1
       0 0 0 0 0]
   \p [0 0 0 0 0
       0 0 0 0 0
       1 1 1 0 0
       1 0 0 1 0
       1 0 0 1 0
       1 1 1 0 0
       1 0 0 0 0
       1 0 0 0 0]
   \, [0 0 0 0 0
       0 0 0 0 0
       0 0 0 0 0
       0 0 0 0 0
       0 0 0 0 0
       0 0 1 1 0
       0 0 0 1 0
       0 0 1 0 0]
   \. [0 0 0 0 0
       0 0 0 0 0
       0 0 0 0 0
       0 0 0 0 0
       0 0 0 0 0
       0 0 0 0 0
       0 0 1 0 0
       0 0 0 0 0]
   \_ [0 0 0 0 0
       0 0 0 0 0
       0 0 0 0 0
       0 0 0 0 0
       0 0 0 0 0
       0 0 0 0 0
       1 1 1 1 1
       0 0 0 0 0]
   \- [0 0 0 0 0
       0 0 0 0 0
       0 0 0 0 0
       0 0 0 0 0
       0 1 1 1 1
       0 0 0 0 0
       0 0 0 0 0
       0 0 0 0 0]
   \? [0 1 1 1 0
       1 0 0 0 1
       0 0 0 0 1
       0 0 0 1 0
       0 0 1 0 0
       0 0 0 0 0
       0 0 1 0 0
       0 0 0 0 0]
   \space [0 0 0 0 0
           0 0 0 0 0
           0 0 0 0 0
           0 0 0 0 0
           0 0 0 0 0
           0 0 0 0 0
           0 0 0 0 0
           0 0 0 0 0]})

(def unknown
  [0 0 0 0 0
   0 0 0 0 0
   0 0 0 0 0
   0 0 0 0 0
   0 0 1 0 0
   0 0 0 0 0
   0 0 0 0 0
   0 0 0 0 0])

(defn get-figure [c] (get figure c unknown))