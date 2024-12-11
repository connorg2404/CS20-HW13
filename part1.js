var MongoClient = require('mongodb').MongoClient;
var readline = require('readline');
var fs = require('fs');

// MongoDB connection string
var connStr = 'mongodb+srv://connorg2404:Tusd2026@cs20-hw13.be1nl.mongodb.net/?retryWrites=true&w=majority&appName=CS20-HW13';

async function processFile() {
    var client = new MongoClient(connStr);

    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    var db = client.db('Stock');
    var collection = db.collection('PublicCompanies');

    // Path to the CSV file
    var filePath = 'companies.csv';
    let currInserts = 0; // Keeps track of insertions currently happening

    var myFile = readline.createInterface({input: fs.createReadStream(filePath)});
    myFile.on('line', function (line) {
        // Split the line into values
        var [name, ticker, price] = line.split(',');
        
        // Log to console
        console.log(`Company: ${name}, Ticker: ${ticker}, Price: ${price}`);

        // Insert into MongoDB
        currInserts++;
        collection.insertOne({
            companyName: name.trim(),
            stockTicker: ticker.trim(),
            stockPrice: parseFloat(price.trim()),
        }).then(() => {
            currInserts--;

            // Check if all operations are complete and the file has ended
            if (currInserts === 0 && myFile.input.closed) {
                client.close();
                console.log('MongoDB connection closed.');
            }
        }).catch((error) => {
            console.error('Error inserting document:', error.message);
            currInserts--;
        });
    });

    myFile.on('close', () => {
        console.log('File processing complete.');

        // If no pending operations, close the client
        if (currInserts === 0) {
            client.close();
            console.log('MongoDB connection closed.');
        }
    });
}

// Run the app
processFile();
