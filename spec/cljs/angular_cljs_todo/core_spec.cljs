(ns angular-cljs-todo.core-spec
  (:require-macros [speclj.core :refer [describe it should=]])
  (:require [speclj.core]
            [angular-cljs-todo.core]))

(describe "todo app"
  (it "works"
    (should= 1 1)))
