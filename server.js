const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');

const app = express();
const port = 8081;
app.use(cors());
app.use(express.json()); // Add this line to parse JSON request bodies


const config = {
    server: 'TECHNO-404\\SQLDEV19',
    database: 'PalmsPOC_db',
    user: 'sa',
    password: 'techno-123',
    driver: 'msnodesqlv8',
    options: {
        trusted_Connection: false // true for Windows authentication, false for SQL Server authentication
    }
};

// Global SQL pool
let pool;

// Connect to the database
async function connectDatabase() {
    try {
        console.log('Connecting to database...');
		pool = await new sql.ConnectionPool(config).connect();
        console.log('Connected to database');
    } catch (error) {
        console.error('Error connecting to database:', error);
        process.exit(1); // Exit the application on connection failure
    }
}

// Handle server startup
app.listen(port, () => {
    console.log('Server is running on http://localhost:${port}');
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
app.get('/getCountries', getCountries);
app.get('/getStates/:CountryID', getStates);
app.get('/getCities/:StateID', getCities);
app.get('/getDepartments', getDepartments);
app.get('/getDesignations', getDesignations);

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
        employeeName,
        gender,
        addressLine1,
        addressLine2,
        cityID,
        email,
        phoneNo,
        departmentID,
        designationID,
		joiningDate,
		isActive
    } = req.body;

	var active = isActive ? 1:0;
	var numDate = joiningDate ? parseInt(joiningDate.replace(/[^0-9]/g, "")) : null;
	var dt = numDate ? new Date(numDate) : null;
	const date = dt ? new Date(dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset())).toISOString() : null;

    const insertQuery = `
        INSERT INTO Employee 
            (EmployeeName, Gender, AddressLine1, AddressLine2, CityID, Email, PhoneNo, DepartmentID, DesignationID, JoiningDate, isActive)
        VALUES 
            (@EmployeeName, @Gender, @AddressLine1, @AddressLine2, @CityID, @Email, @PhoneNo, @DepartmentID, @DesignationID, @date, @active)
    `;

    const inputParams = {
        employeeName,
        gender,
        addressLine1,
        addressLine2,
        cityID,
        email,
        phoneNo,
        departmentID,
        designationID,
		date,
		active
    };

    try {
        const request = await pool.request();

        Object.keys(inputParams).forEach(key => {
            request.input(key, sql.VarChar(inputParams[key] ? (inputParams[key].length?inputParams[key].length:6) : 1), inputParams[key]);
			//console.log(key + ' -> ' + inputParams[key] + ' -> ' + (inputParams[key] ? (inputParams[key].length?inputParams[key].length:6) : 6));
        });

        const result = await request.query(insertQuery);
    
        res.status(201).json({ message: 'Employee added successfully' });
    } catch (error) {
        console.error('Error adding data:', error);
        res.status(500).json({ error: 'Error adding data (' + error + ')' });
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
        Email,
        PhoneNo,
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
        const query = `SELECT
		   c.CityID, c.CityCode, c.CityName, c.PinCode,
		   s.StateID, s.StateCode, s.StateName 
		FROM  City as C 
		   LEFT JOIN State as s 
		   ON c.StateID = s.StateID`;

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

async function getCountries(req, res) {
    try {
        const query = `SELECT Country.CountryID,Country.CountryCode,Country.CountryName FROM Country
		RIGHT JOIN State ON State.CountryID = Country.CountryID
		RIGHT JOIN City ON City.StateID = State.StateID`;

        const result = await pool.request().query(query);
        res.json({data: result.recordset});
    } catch (error) {
        console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data' });
    }
}

async function getStates(req, res) {
    try {
        const { CountryID } = req.params;
		
		const query = `SELECT State.StateID,State.StateCode,State.StateName FROM State
		RIGHT JOIN City ON City.StateID = State.StateID
		WHERE State.CountryID = @CountryID`;

		const request = await pool.request();
		request.input('CountryID', sql.Int, CountryID);
		const result = await request.query(query);
		
        res.json({data: result.recordset});
    } catch (error) {
        console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data' });
    }
}

async function getCities(req, res) {
    try {
        const { StateID } = req.params;
		
		const query = `SELECT * FROM City WHERE StateID = @StateID`;

		const request = await pool.request();
		request.input('StateID', sql.Int, StateID);
		const result = await request.query(query);
		
        res.json({data: result.recordset});
    } catch (error) {
        console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data' });
    }
}

async function getDepartments(req, res) {
    try {
        const query = `SELECT * FROM Department`;

        const result = await pool.request().query(query);
        res.json({data: result.recordset});
    } catch (error) {
        console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data' });
    }
}

async function getDesignations(req, res) {
    try {
        const query = `SELECT * FROM Designation`;

        const result = await pool.request().query(query);
        res.json({data: result.recordset});
    } catch (error) {
        console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data' });
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