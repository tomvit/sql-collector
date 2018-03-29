# Oracle SQL Query Metric Collector

Oracle SQL Query Metric Collector is a javascript utility running in [SQLcl](http://www.oracle.com/technetwork/developer-tools/sqlcl/overview/sqlcl-index-2994757.html) that you can use to execute Oracle DB SQL SELECT statements in a loop and write results to standard output in CSV format. If you have a Oracle database with tables storing time series measurements, then this utility allows you to easily query the data and convert them to CSV format. It was originally developed as a probe for [Universal Metric Collector](https://github.com/rstyczynski/umc) but can be used independently on UMC. 

In order to use sql-collector, you need to have the following in your system:

1. [Oracle SQL command line utility (SQLcl)](http://www.oracle.com/technetwork/developer-tools/sqlcl/overview/sqlcl-index-2994757.html) available on your system path.
2. Access (a valid connection string) to a running Oracle database.

Note that in case you do not have an access to a running Oracle database and you want to see how sql-collector works, you can use Oracle Database Express Edition (XE) running as a Docker container (see [Oracle XE Docker Image](https://hub.docker.com/r/wnameless/oracle-xe-11g/) for details).

Run ```sql-collector --help``` to get more information on how to use it. 

```
Oracle SQL query metric collector v1.0
Usage: --connect <string> --query <string> --count <number> --interval <number> [--noHeaders] [--showSQLErrors] [--#([a-zA-Z0-9_\-\*\+\.]+) <string>] [--test] 

Where: 
   --connect                  DB connection string.
   --query                    SQL query file.
   --count                    Number of iterations the query will run.
   --interval                 Delay in seconds betwen iterations.
   --noHeaders                Headers will not be written to the output.
   --showSQLErrors            SQL errors will be written to the output.
   --#([a-zA-Z0-9_\-\*\+\.]+) A regular expression to replace a string with a value in the query.
   --test                     Test and be verbose, will run only one iteration of the query.
```

The below command shows an example of sql-collector running from command line: 

```
sql-collector --connect brian/topsecret@127.0.0.1:1521 --query mysqlquery.sql --interval 10 --count 3 
```

In this example, sql-collector will access your database at ```127.0.0.1:1521``` as user ```brian``` with password ```topsecret```, will run a SQL query from ```mysqlquery.sql``` 3 times and will wait 10 seconds between runs. If your sql query contains placeholders that you want to replace with specific values, you can specify such placeholders and their values as command line arguments for sql-collector as follows:  

```
sql-collector --connect brian/topsecret@127.0.0.1:1521 --query mysqlquery.sql --interval 10 --count 3 --#MYSCHEMA HERSCHMEA 
```

In the above example, sql-collector will replace any occurrence of ``MYSCHEMA`` string by ``HERSCHEMA`` string.  

For debug purposes, you can execute the sql-collector in the test mode by specifying the ```--test``` argument in wihch case the sql-collector will run one iteration of the SQL query and will output the debug information as the below example shows. 

```
$ sql-collector --connect $DB_CONNSTR --query sys-long-running-queries.sql --count 2 --interval 2 --delimiter ";" --test

* sql-collector executed in the test mode.
* Arguments parsed as JSON object:
{"connect":{"name":"connect","value":"sys/oracle@10.0.2.2:1521:xe as sysdba","def":{"name":"connect",
"required":true,"desc":"DB connection string.","__use":1}},"query":{"name":"query","value":"sys-long-running-queries.sql",
"def":{"name":"query","required":true,"desc":"SQL query file.","__use":1}},"count":{"name":"count",
"value":2,"def":{"name":"count","required":true,"desc":"Number of iterations the query will run.","__use":1}},
"interval":{"name":"interval","value":2,"def":{"name":"interval","required":true,
"desc":"Delay in seconds betwen iterations.","__use":1}},"delimiter":{"name":"delimiter","value":";",
"def":{"name":"delimiter","required":false,"desc":"CSV delimiter, the default value is ','.","__use":1}},
"test":{"name":"test","value":null,"def":{"name":"test","required":false,
"desc":"Test and be verbose, will run only one iteration of the query.","__use":1}}}

* SQL query:
select * from
(
  select
     opname,
     start_time,
     target,
     sofar,
     totalwork,
     units,
     elapsed_seconds,
     message
   from
        v$session_longops
  order by start_time desc
)
where rownum <=1;


* Connecting to the DB...
* Running one iteration of the query...
"OPNAME";"START_TIME";"TARGET";"SOFAR";"TOTALWORK";"UNITS";"ELAPSED_SECONDS";"MESSAGE"
"Gather Table's Index Statistics";28-MAR-18;"";3;3;"Indexes";0;"Gather Table's Index Statistics: Table INDPART$ : 3 out of 3 Indexes done"
```


# License

free and free as a bird