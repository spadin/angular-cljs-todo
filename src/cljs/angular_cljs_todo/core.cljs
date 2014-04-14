(ns angular-cljs-todo.core
  (:use-macros [purnam.core :only [! def* def*n]]
               [gyr.core    :only [def.module def.controller]]))

(def.module todo-app [])

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

(def.controller todo-app.todo-controller [$scope]
  (! $scope.todos todos)
  (! $scope.addTodo add-todo))
