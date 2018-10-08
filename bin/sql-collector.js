/*
    Oracle SQL Query Metric Collector, tomas@vitvar.com, March 2018
    This script runs in SQLcl, use sql-collector script to run it
*/

var VERSION = "v1.1";

// various java libraries used by this script 
var Thread = Java.type("java.lang.Thread");
var System = Java.type("java.lang.System");
var Paths = Java.type("java.nio.file.Paths");
var Files = Java.type("java.nio.file.Files");
var Utils = Java.type("oracle.dbtools.db.DBUtil");
var PrintWriter = Java.type("java.io.PrintWriter");
var FileWriter = Java.type("java.io.FileWriter");
var OutputStreamWriter = Java.type("java.io.OutputStreamWriter");

// set error stream but does not really work!?
var pw = new PrintWriter(new OutputStreamWriter(System.err, Java.type('java.nio.charset.StandardCharsets').UTF_8));
sqlcl.getScriptRunnerContext().setErrWriter(pw);

// get the sqlcDir - must be set as env variable
var sqlcDir = System.getenv("sqlcDir");
if (!sqlcDir || sqlcDir === "") {
  System.err.println(new Date() + ": The environment variable $sqlcDir has not been set! Are you running sql-collector script?");
  System.exit(1);
}

load(sqlcDir + "/libs/ArgumentsParser.js");
load(sqlcDir + "/libs/Utils.js");

var credentialsLockFile = sqlcDir + "/credlock";

var programName = 
  "Oracle SQL query metric collector " + VERSION;

var optionDef = [
  { name: 'connect',            type: String,    required: true,  desc : "DB connection string." },
  { name: 'query',              type: String,    required: true,  desc : "SQL query file." },
  { name: 'count',              type: Number,    required: true,  desc : "Number of iterations the query will run." },
  { name: 'interval',           type: Number,    required: true,  desc : "Delay in seconds betwen iterations." },
  { name: 'delimiter',          type: String,    required: false, desc : "CSV delimiter, the default value is ','." },
  { name: 'noHeaders',                           required: false, desc : "Headers will not be written to the output." },  
  { name: 'showSQLErrors',                       required: false, desc : "SQL errors will be written to the output." },  
  { name: 'noCredlock',                          required: false, desc : "Do not use credentials locking." },                                  
  { name: '#([a-zA-Z0-9_\\-\\*\\+\\.]+)',
                                type: String,    required: false, desc : "A regular expression to replace a string with a value in the query." }, 
  { name: 'test',                                required: false, desc : "Test and be verbose, will run only one iteration of the query." },
]

// last error 
var lastError;

// clean arguments
// when arguments are passed in sqljs, the first argument is the script name
var cmdargs = [];
for (var i = 1; i < args.length; i++)
  cmdargs.push(args[i]);

// *** helper functions

// checks whether credentials are locked. 
// they will be locked when login fails
function checkCredentialsNotLocked(connstr) {
  if (Files.exists(Paths.get(credentialsLockFile))) {
    var connstrHash = stringHash(connstr);
    var lines = Files.readAllLines(Paths.get(credentialsLockFile), 
      Java.type('java.nio.charset.StandardCharsets').UTF_8);  
    for (var i = 0; i < lines.length; i++) {
      if (connstrHash.matches(lines[i]))
        errorAndExit("The credentials is locked. Check " + credentialsLockFile + ".")
    }
  }
}

// locks credentiails, i.e. writes credentials hash to a lock file
function lockCredentials(connstr) {
  var pw = new PrintWriter(new FileWriter(credentialsLockFile, true));
  try {
    pw.println(stringHash(connstr));
  } finally {
    pw.close();
  } 
}

// this function will set and run SQL statement
function runSQL(statement) {
  lastError = null;
  sqlcl.setStmt(statement); 
  sqlcl.run();

  // this will retrieve the error from the last SQL run or null if there was no error
  // This is undocumented; I only determined this via sqlcl code decompiling and testing various options on the script runner context
  // hope this will not change with future sqlcl releases!
  lastError = sqlcl.getScriptRunnerContext().getProperty("sqldev.last.err.message.forsqlcode");
}

// checks an error and act accordingly such as exit when cannot login to the DB
function checkError(errorText) {
    if (errorText) { 
      // invalid credentials
      if (errorText.match(".*invalid username/password.*")) {
        if (!argv.noCredlock) {
          printError("sql-collector cannot connect to the DB and will lock the current credentials. " + 
            "You will need to remove the lock manually if you want to use the same credentials again.\n"); 
          lockCredentials(argv.connect.value);
        }
      }

      // print error text and exit sql-collector 
      errorAndExit(errorText);
    }   
}

// returns SQL file as string
function loadSQLTemplate(file) {
  var lines = Files.readAllLines(Paths.get(file), Java.type('java.nio.charset.StandardCharsets').UTF_8);  
  var s = ""; for (var i = 0; i < lines.length; i++) s += lines[i] + "\n";
  return s;
}

function runSQLIteration(iteration) {
  runSQL("SET HEADING " + (iteration > 1 || argv.noHeaders ? "OFF" : "ON"));
  runSQL(sql);
}

// main 

try {

  // parse command line arguments and display help if there is error
  var argv = parseArgsAndHelp(programName, cmdargs, optionDef);

  if (argv) {

    if (argv.test) {
      print("* sql-collector executed in the test mode.");
      print("* Arguments parsed as JSON object:");
      print(JSON.stringify(argv));
      print('');
    }

    // check that value of --connect is a valid connection string
    if (argv.connect && argv.connect.value) {
      /*if (!argv.connect.value.match(/[a-zA-Z0-9]+\/.+@[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+:[a-zA-Z0-9_]+( as sysdba|sysoper)?/)) 
        errorAndExit("The connection string is invalid!")*/
    } else {
      errorAndExit("The connection string has not been defined!")
    }

    // check if the supplied connection string is not locked
    if (!argv.noCredlock)
      checkCredentialsNotLocked(argv.connect.value);

    if(!Files.exists(Paths.get(argv.query.value)))
        errorAndExit("The sql query file " + argv.query.value + " does not exist!");

    // load sql query from the input file
    var sql = loadSQLTemplate(argv.query.value);

    // replace variables in the query
    for (var arg in argv) {
      if (argv[arg].name.startsWith("#"))
        sql = sql.replace(new RegExp(argv[arg].name.substr(1), 'g'), argv[arg].value);  
    }

    if (argv.test) {
      print("* SQL query:");
      print(sql);
      print('');
    }

    // global SQL params
    runSQL("SET SQLBLANKLINES ON");
    runSQL("SET TRIMSPOOL ON");
    
    if (argv.delimiter && argv.delimiter.value)
      runSQL("SET SQLFORMAT DELIMITED " + argv.delimiter.value + ' " "');
    else
      runSQL("SET SQLFORMAT CSV");

    if (!argv.showSQLErrors && !argv.test) {
      runSQL("SET ECHO OFF");
      runSQL("SET FEEDBACK OFF");
    }

    // run only once in the test mode
    if (argv.test) {
      print("* Running one iteration of the query...");
      argv.count.value = 1;
    }

    if (argv.test) {
      print("* Connecting to the DB...");
    }

    runSQL("CONNECT " + argv.connect.value);
    checkError(lastError);

    // run SQL "count" times with "interval" bettwen runs
    for (var i = 0; i < argv.count.value; i++) {
      var start_t=new Date().valueOf();
      runSQLIteration(i + 1);
      checkError(lastError);
      elapsed_s=new Data().valueOf()-start_t;
      
      if (i < argv.count.value - 1) {
        if (elapsed_s > argv.interval.value * 1000*0.75) {
          printError("It took " + elapsed_s/1000 + " seconds to retrieve the data which is more than 2/3 of the delay (" + 
            argv.interval.value + " seconds). The time will not be adjusted");
          Thread.sleep(argv.interval.value * 1000);
        } else
          Thread.sleep(argv.interval.value * 1000 - elapsed_s);
      }        
    }

  }
} catch (e) {
  errorAndExit(e);
}
