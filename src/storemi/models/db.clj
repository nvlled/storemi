(ns storemi.models.db
  (:require 
    [clojure.walk :refer [keywordize-keys]]
    [storemi.settings :as settings]
    [clojure.java.jdbc :as sql]
    [cheshire.core :as json]))

(defn read-credentials []
  (try
    (-> (slurp settings/credentials-file)
        read-string
        eval
        :db)
    (catch java.io.FileNotFoundException e )))

(def db
  (or (System/getenv "DATABASE_URL")
      (merge
        settings/default-db
        (read-credentials))))


(def known-tables
  ["stories" "users"])

;; utils - move to other namespace later
(defn json-string [data]
  (try (json/generate-string data)
       (catch Exception _)))

(defn json-parse [data]
  (try (-> (json/parse-string data)
           keywordize-keys)
       (catch Exception _)))

(defn json-string-vals [m & ks]
  (reduce 
    (fn [acc k]
      (assoc acc k
             (if (nil? (m k))
               (m k)
               (json-string (m k)))))
    m 
    ks)) 

(defn remove-nil [m]
  (into {} (filter #(-> % second nil? not) m)))

(defn dbdo [& sqls]
  (apply sql/db-do-commands
         (cons db sqls)))

(defn dbde [& sqls]
  (try (apply dbdo sqls)
       (catch Exception e)))

(defn clean-db []
  (let [tables known-tables]
    (map (comp dbde sql/drop-table-ddl)
         tables)))

(defn query [q]
  (sql/query db q))

(defn query-one [q]
  (first (query q)))

(defn update! [table set-map where]
  (sql/update! db table set-map where))

(defn insert! [table data]
  (sql/insert! db table data))

(defn delete! [table where]
  (sql/delete! db table where))

(defn tables-initialized? []
  (try
    (query [(str "select * from "
                 (apply str (interpose "," known-tables))
                 " limit 1")]) 
    true
    (catch Exception e false)))

(defn test-connection []
  (try
    (query ["select 1" ])
    (catch Exception e 
      (println "*** Failed to connect to database: " (.getMessage e))
      (println "*** Configure default-db at src/storemi/settings.clj")
      (System/exit 1))))


