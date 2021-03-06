(ns storemi.models.story
  (:require
    [clojure.walk :refer [keywordize-keys]]
    [hiccup.util :refer [escape-html]]
    [clj-http.client :as client]
    [clojure.java.jdbc :as sql]
    [storemi.models.db :as db]
    [storemi.common :as com]
    [storemi.js :as js]
    ))

(def script-template
  "
* %s

%s

# stuffname: stuffman

** (1) Prologue chapter

*** (1.1) Opening scene
This is a stub. [a: Link to scene A]. Say some stuff here. Some [b: Link to scene B].

# a: 1.2
# b: 1.3

*** (1.2) Scene A
Stuffs and stuffs. Saying about stuff here. {a: Link to chapter 2} and [b: link to scene C]. Oh yeah, more stuff to say.

You see a sample image

<sample: A text describing the image>

You are enlightened.

# a: 2
# b: 1.4

*** (1.3) Scene B
The zombie stuff ate some zomebie stuff. Go to [a: scene C]

# a: 1.4

*** (1.4) Scene C
This scene stuff has no stuff in it so no more stuff to say.


** (2) Chapter 2

*** (2.1) Opening scene of chapter 2
Stuff goes here and there. Go to {a: chapter 3}
Oh yeah, what's your name stuff? --b: stuffname, ok--

# a: 3
# b: 2.2

*** (2.2) Stuff response
Got it, your stuffname is ++stuffname++. Well then, off to {a: chapter 3} then, ++stuffname++.

# a: 3

** (3) Chapter 3

*** (2.1) some stuff scene
saying stuff about the scene stuff. Hello, ++stuffname++, nice bad weather we're having huh. Also, stuff some more stuff on the stuff.

---[images]---
# sample: /site-images/sample-a.png
  ")

(def username-maxlen 20)
(def title-maxlen 70)
(def synopsis-maxlen 200)

(defn render-template [& [title synopsis]]
  (format script-template
    title (or "this is the synopsis")))

(defn varchar [size]
  (str "varchar(" size ")"))

(defn create-story-table []
  (db/dbdo
    (sql/create-table-ddl
      :stories
      [:id "serial" "PRIMARY KEY"]
      [:username (varchar username-maxlen)]
      [:title (varchar title-maxlen)]
      [:synopsis (varchar synopsis-maxlen)]
      [:published "boolean"]
      [:data "text"]
      [:script "text"])))

(defn insert-story [story]
  (let [{:keys [title username data script synopsis]}
        story
        response
        (db/insert!
          :stories
          {:username  username
           :data      (db/json-string data)
           :script    script
           :title     (escape-html title)
           :synopsis  (escape-html synopsis)})]
    (first response)))

(defn create-story [creator title &[synopsis]]
  (let [script (render-template title (or synopsis))
        data (js/parse-script script)]
    (insert-story
      {:username creator
       :script script
       :data data
       :title title
       :synopsis synopsis})))

(defn user-owned [{:keys [username id]}]
  (let [data (db/query-one
               ["select * from stories where id = ?"
                (com/read-int id -1)])]
    (= (:username data) username)))

(defn update-story [id data script]
  (db/update!
    :stories
    (db/remove-nil
      {:title (get data :storyTitle)
       :synopsis (get data :synopsis)
       :data (db/json-string data)
       :script script})
    ["id = ?" (com/read-int id -1)]))

(defn get-story [id]
  (let [result
        (db/query-one
          ["select * from stories where id = ?"
           (com/read-int id -1)]) ]
    (when result
      (assoc result :data
             (db/json-parse (:data result))))))

(defn get-story-by [username id]
  (let [result
        (db/query-one
          ["select * from stories where id = ? and username = ?"
           (com/read-int id -1) username]) ]
    (when result
      (assoc result :data
             (db/json-parse (:data result))))))

(defn story-match [request]
  (get-story (get-in request [:params :story-id])))

(defn story-match-by
  ([request]
   (story-match-by
     (get-in request [:params :username])
     request))
  ([username request]
   (get-story-by
     username
     (get-in request [:params :story-id]))))

(defn get-published-stories [username]
  (db/query
    ["select * from stories where username = ? and published"
     username]))

(defn assoc-default-bindings [story chapter]
  (assoc
    chapter
    "defaultBindings" (get story "defaultBindings")
    "story" story))

(defn get-chapter [story ch-id]
  (when-let [chapter
             (com/find-with-val
               (get story "chapters") "label" ch-id)]
    (assoc-default-bindings story chapter)))

(defn get-opening-chapter [story]
  (assoc-default-bindings
    story
    (first (get story "chapters"))))

(defn get-scene [chapter sc-id]
  (com/find-with-val
    (get chapter "scenes") "label" sc-id))

(defn recent-stories [& [limit]]
  (let [limit (or limit 5)
        limit (min limit 100)]
    (db/query
      ["select id, title, synopsis, username from stories
       order by id desc
       limit ?"
       limit])))

(defn select-sql [& addendums]
  (str "select * from stories "
       (apply str addendums)))

(defn filter-sql [exact & criterias]
  (let [s (if exact
            "%s = ?"
            "%s ~* ?")]
    (str
      "where "
      (apply str
             (interpose " or " (map #(format s %) criterias))))))

(defn valid-column [name]
  (some #(= name %) ["username" "title" "synopsis"]))

(defn what-sql [val criteria & [exact]]
  (if (valid-column criteria)
    [(select-sql (filter-sql exact criteria)) val]
    [(select-sql
       (filter-sql exact "username" "title" "synopsis"))
     val val val]))

(defn what-page [page-data]
  (when page-data
    ; safe if only page-data isn't direct user input
    (format "limit %d offset %d"
            (:limit page-data)
            (:offset page-data))))

(defn query-stories [val & {:keys [criteria exact page-data]}]
  (let [sql (if-not val
              (select-sql)
              (what-sql val criteria exact))
        result (vec (db/query sql))]

    {:page-data page-data
     :total (count result)
     :stories
     (if (empty? (select-keys page-data [:start :end]))
       result
       (com/safe-subvec
         result
         (:start page-data)
         (:end page-data)))}))

(defn user-stories [username]
  (db/query
    ["select id, title, username from stories where username = ?
     order by id desc"
     username]))

(defn delete-story [username id]
  (db/delete! :stories
              ["username = ? and id = ?"
               username (com/read-int id -1)]))

(defn from-request [{params :params}]
  (select-keys
    params [:id :username :title :body :script :synopsis :data]))


