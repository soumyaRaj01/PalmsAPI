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
app.get('/getEmployee', getEmployee);
app.post('/addEmployee', addEmployee);
app.put('/updateEmployee/:EmpID', updateEmployee);
app.delete('/deleteEmployee/:EmpID', deleteEmployee);
app.get('/getCity', getCity);
app.post('/addCity', addCity);
app.put('/updateCity/:CityID', updateCity);
app.delete('/deleteCity/:CityID', deleteCity);

// Route Handlers
async function getEmployee(req, res) {
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

async function addEmployee(req, res) {
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
    
        res.status(201).json({ message: 'Employee added successfully' });
    } catch (error) {
        console.error('Error adding data:', error);
        res.status(500).json({ error: 'Error adding data' });
    }
}

async function updateEmployee(req, res) {
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
    
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.status(200).json({ message: 'Employee updated successfully' });
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ error: 'Error updating data' });
    }
}

async function deleteEmployee(req, res) {
    const { EmpID } = req.params;

    const deleteQuery = 'DELETE FROM Employee WHERE EmpID = @EmpID';

    try {
        const request = await pool.request();

        request.input('EmpID', sql.Int, EmpID);

        const result = await request.query(deleteQuery);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting data:', error);
        res.status(500).json({ error: 'Error deleting data' });
    }
}

async function getCity(req, res) {
    try {
        const query = `
            SELECT * FROM City;
        `;

        const result = await pool.request().query(query);
        res.json({data: result.recordset});
    } catch (error) {
        console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data' });
    }
}

async function addCity(req, res) {
    const { 
        CityName,
        CityCode,
        StateID,
        PinCode
    } = req.body;

    const insertQuery = `
        INSERT INTO City 
            (CityName, CityCode, StateID, PinCode)
        VALUES 
            (@CityName, @CityCode, @StateID, @PinCode)
    `;

    const inputParams = {
        CityName,
        CityCode,
        StateID,
        PinCode
    };

    try {
        const request = await pool.request();

        Object.keys(inputParams).forEach(key => {
            request.input(key, sql.VarChar(50), inputParams[key]);
        });

        const result = await request.query(insertQuery);
    
        res.status(201).json({ message: 'City added successfully' });
    } catch (error) {
        console.error('Error adding data:', error);
        res.status(500).json({ error: 'Error adding data' });
    }
}

async function updateCity(req, res) {
    const { CityID } = req.params;
    const { 
        CityName,
        CityCode,
        StateID,
        PinCode
    } = req.body;

    let updateQuery = 'UPDATE City SET';
    const inputParams = {};

    Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
            updateQuery += ` ${key} = @${key},`;
            inputParams[key] = req.body[key];
        }
    });
    
    updateQuery = updateQuery.slice(0, -1) + ' WHERE CityID = @CityID';

    try {
        const request = await pool.request();

        Object.keys(inputParams).forEach(key => {
            request.input(key, sql.VarChar(50), inputParams[key]);
        });

        request.input('CityID', sql.Int, CityID);

        const result = await request.query(updateQuery);
    
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'City not found' });
        }

        res.status(200).json({ message: 'City updated successfully' });
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ error: 'Error updating data' });
    }
}

async function deleteCity(req, res) {
    const { CityID } = req.params;

    const deleteQuery = 'DELETE FROM City WHERE CityID = @CityID';

    try {
        const request = await pool.request();

        request.input('CityID', sql.Int, CityID);

        const result = await request.query(deleteQuery);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'City not found' });
        }

        res.status(200).json({ message: 'City deleted successfully' });
    } catch (error) {
        console.error('Error deleting data:', error);
        res.status(500).json({ error: 'Error deleting data' });
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