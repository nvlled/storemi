(ns storemi.models.user
  ;(:refer-clojure :exclude [compare])
  (:import [org.mindrot.jbcrypt BCrypt])
  (:require 
    [clojure.java.jdbc :as sql]
    [storemi.models.db :as db]
    ))

(def db
  {"x" "123"
   "y" "456"})

(def admins #{"y"})

(defn- encrypt [raw]
  (BCrypt/hashpw raw (BCrypt/gensalt)))

(defn- matches? [raw encrypted]
  (BCrypt/checkpw raw encrypted))

(defn admin? [username]
  (contains? admins username))

(defn create-user-table []
  (db/dbdo
    (sql/create-table-ddl
      :users
      [:id "serial" "PRIMARY KEY"]
      [:username "varchar(20)"]
      [:password "varchar(60)"]
      [:about "varchar(500)"]))) 

(defn add-user [username password & [about]]
  (db/insert! 
    :users
    {:username username
     :password (encrypt password)
     :about (or about "")}))

(defn update-password [username password]
  (db/update! 
    :users
     :password (encrypt password)
    ["username = ?" username]))

(defn valid-user? [username password]
  (let [user 
        (db/query-one
          ["select * from users where username = ?" username])]
    (and user (matches? password (:password user)))
    ))

(defn get-data [username]
  (db/query-one
    ["select * from users where username = ?" username]))





