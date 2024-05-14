const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');

const app = express();
const port = 8081;
app.use(cors());
app.use(express.json()); // Add this line to parse JSON request bodies


const config = {
    server: 'TECHNO-404\\SQLDEV19',
    database: 'PalmsPOCdb',
    user: 'sa',
    password: 'techno-123',
    driver: 'msnodesqlv8',
    options: {
        trustedConnection: true
    }
};

// Global SQL pool
let pool;

// Connect to the database
async function connectDatabase() {
    try {
        pool = await new sql.ConnectionPool(config).connect();
        console.log('Connected to database');
    } catch (error) {
        console.error('Error connecting to database:', error);
        process.exit(1); // Exit the application on connection failure
    }
}

// Handle server startup
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    connectDatabase();
});

// Routes
app.get('/data', getData);
app.post('/add', addData);
app.put('/update/:EmpID', updateData);

// Route Handlers
async function getData(req, res) {
    try {
        const query = `
            SELECT * FROM Employee;
        `;

        const result = await pool.request().query(query);
        res.json({data: result.recordset});
    } catch (error) {
        console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data' });
    }
}

async function addData(req, res) {
    const { 
        EmployeeName,
        Gender,
        AddressLine1,
        AddressLine2,
        CityID,
        StateID,
        EmailAddress,
        PhoneNumber,
        DepartmentID,
        DesignationID 
    } = req.body;

    const insertQuery = `
        INSERT INTO Employee 
            (EmployeeName, Gender, AddressLine1, AddressLine2, CityID, StateID, EmailAddress, PhoneNumber, DepartmentID, DesignationID)
        VALUES 
            (@EmployeeName, @Gender, @AddressLine1, @AddressLine2, @CityID, @StateID, @EmailAddress, @PhoneNumber, @DepartmentID, @DesignationID)
    `;

    const inputParams = {
        EmployeeName,
        Gender,
        AddressLine1,
        AddressLine2,
        CityID,
        StateID,
        EmailAddress,
        PhoneNumber,
        DepartmentID,
        DesignationID
    };

    try {
        const request = await pool.request();

        Object.keys(inputParams).forEach(key => {
            request.input(key, sql.VarChar(50), inputParams[key]);
        });

        const result = await request.query(insertQuery);
    
        res.status(201).json(result);
    } catch (error) {
        console.error('Error adding data:', error);
        res.status(500).json({ error: 'Error adding data' });
    }
}

async function updateData(req, res) {
    const { EmpID } = req.params;
    const { 
        EmployeeName,
        Gender,
        AddressLine1,
        AddressLine2,
        CityID,
        StateID,
        EmailAddress,
        PhoneNumber,
        DepartmentID,
        DesignationID 
    } = req.body;

    let updateQuery = 'UPDATE Employee SET';
    const inputParams = {};

    Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
            updateQuery += ` ${key} = @${key},`;
            inputParams[key] = req.body[key];
        }
    });
    
    updateQuery = updateQuery.slice(0, -1) + ' WHERE EmpID = @EmpID';

    try {
        const request = await pool.request();

        Object.keys(inputParams).forEach(key => {
            request.input(key, sql.VarChar(50), inputParams[key]);
        });

        request.input('EmpID', sql.Int, EmpID);

        const result = await request.query(updateQuery);
    
        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ error: 'Error updating data' });
    }
}

// Handle server shutdown
process.on('SIGINT', () => {
    console.log('Closing database connection');
    if (pool) {
        pool.close();
    }
    process.exit();
});