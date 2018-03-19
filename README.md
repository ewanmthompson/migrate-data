# blog-api

This is the Module 3 assignment lab for the edX Introduction to NodeJS course.

This project merge data from two sources to a MongoDB database.

# Usage

$ npm i

$ node migrate-data.js nnnn
where nnnn is an integer specfying the parallel batch size, if omitted nnnn defaults to 100

# Design

* MongoClient is used to access and manipulate the database
* Parallel inserts are achieved using "async" https://caolan.github.io/async/
* A CLI argument specifies the parallel batch size
* Recursion is used to fire off the next batch of parallel inserts when the previous batch is finished


# Evolution and Difficulties

Only real challenge was getting the sytax correct when building the task list in an array prior to calling "parallel". Also a bit of research was required to calculate millisecond timings, in the I used "process.hrtime" to do the calc.


# Testing

To test, I simply ran the program and resolved any processing errors until I got a clean run. I used the intregrated debugger in Visual Studio Code to step through the code to diagnose any problems.

Once I got a clean run I checked that the record count was correct. I checked then a sample of records from the beginning, middle and end of the customer datasets to ensure records looked correct and data was merged correctly and was in alignment.

I then ran a number of tests to check the optimum level of parallelism. On my machine, 150 records per batch is a sweet spot.
