(ns storemi.urlfor
  (:require
    [storemi.lib.urldef :refer [defurl]]))

(defurl login "/login")
(defurl logout "/logout")
(defurl register "/register")
(defurl about "/about")

(defurl upload-image "/upload")
(defurl list-images "/images/:username")
(defurl image "/images/:username/:filename")

(defurl story-index "/story")
(defurl story-create story-index "/create")
(defurl user-index story-index "/:username")

(defurl story user-index "/:story-id")
(defurl chapter story "/chapter/:chapter-id")
(defurl scene chapter "/scene/:scene-id")

(defurl story-delete story "/delete")
(defurl story-edit story "/edit")

(defurl story-data story "/data")





