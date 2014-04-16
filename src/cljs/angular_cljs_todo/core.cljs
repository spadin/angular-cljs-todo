(ns angular-cljs-todo.core
  (:use-macros [gyr.core    :only [def.module def.controller]]
               [purnam.core :only [! def* def*n]]))

(def.module todo-app [])

(def*n new-todo [text]
  {:text text :done false})

(def* todos [(new-todo "clean dishes")
             (new-todo "throw out garbage")])

(def*n clear-new-todo-text [$scope]
  (! $scope.newTodoText))

(def*n add-todo [text]
  (todos.push (new-todo text))
  (clear-new-todo-text this))

(def.controller todo-app.todo-controller [$scope]
  (! $scope.todos todos)
  (! $scope.addTodo add-todo))
