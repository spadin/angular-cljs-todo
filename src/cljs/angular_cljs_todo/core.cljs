(ns angular-cljs-todo.core
  (:use-macros [purnam.core :only [! def* def*n]]))

(defn expose [src dest]
  (let [dest (name dest)]
    (! js/window.|dest| src)))

(def* todos [{:text "clean dishes"
              :done false}
             {:text "throw out garbage"
              :done false}])

(def*n clear-new-todo-text [$scope]
  (! $scope.newTodoText))

(def*n add-todo [text]
  (todos.push {:text text
               :done false})
  (clear-new-todo-text this))

(def*n todo-controller [$scope]
  (! $scope.todos todos)
  (! $scope.addTodo add-todo))

(expose todo-controller :TodoController)
