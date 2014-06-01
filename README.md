storemi
=======

An alternative, scene-based, non-linear story-telling platform... thing

## Prerequisites

You will need [Leiningen][1] 1.7.0 or above installed.

[1]: https://github.com/technomancy/leiningen

You will also need a relational database running.
You can either:
* Edit the settings.clj at the src subdirectory
* or create a credentials.clj at the project directory
   with the following contents:
```	
{:db {:subprotocol "postgresql"
      :subname "//127.0.0.1:5432/DBNAME"
      :user "USERNAME"
      :password "PASSWORD"}}
```

Change the fields according to your database setup.

## Running

To start a web server for the application, run:

    lein run

lein will automatically download the dependencies, so 
it may take a while. Then open your browser at localhost:6060


## Status

Seems to be working at the moment. A demo can be viewed [here](http://storemi.herokuapp.com).

## TODO
* Server-side html rendering
* Fix homepage





