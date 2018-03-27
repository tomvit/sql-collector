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

# License

free and free as a bird