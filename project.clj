(defproject angular-cljs-todo "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url  "http://www.eclipse.org/legal/epl-v10.html"}

  :dependencies [[org.clojure/clojure "1.5.1"]
                 [im.chit/purnam "0.4.3"]]

  :profiles {:dev {:dependencies [[org.clojure/clojurescript "0.0-2014"]
                                  [speclj "3.0.0"]]}}
  :plugins [[speclj "3.0.0"]
            [lein-cljsbuild "1.0.2"]]

  :cljsbuild {:builds        {:dev  {:source-paths   ["src/cljs" "spec/cljs"]
                                     :compiler       {:output-to     "js/angular-cljs-todo_dev.js"
                                                      :optimizations :whitespace
                                                      :pretty-print  true}
                                     :notify-command ["phantomjs"  "bin/speclj" "js/angular-cljs-todo_dev.js"]}

                              :prod {:source-paths ["src/cljs"]
                                     :compiler     {:output-to     "js/angular-cljs-todo.js"
                                                    :optimizations :whitespace}}}
              :test-commands {"test" ["phantomjs" "bin/speclj" "js/angular-cljs-todo_dev.js"]}}

  :source-paths ["src/clj" "src/cljs"]
  :test-paths ["spec/clj"])
