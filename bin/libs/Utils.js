/*
    Oracle SQL Query Metric Collector, tomas@vitvar.com, March 2018
    utility functions
*/

// calculates the string hash
function stringHash(s) {
  var h = 0, l = s.length, i = 0;
  if ( l > 0 )
    while (i < l)
      h = (h << 5) - h + s.charCodeAt(i++) | 0;
  if (h < 0)
    h = 0xFFFFFFFF + h + 1;
  return h.toString(16);
}

// print the error to the err output
function printError(text) {
  System.err.println(new Date() + ": " + text);
}

// print the error and exit
function errorAndExit(text) {
  printError(text);
  System.exit(1);  
}

