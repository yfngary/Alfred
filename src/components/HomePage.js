// src/components/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div>
            <h1>Welcome to the Home Page</h1>
            <Link to="/register">Go to Register</Link>
        </div>
    );
};

export default HomePage;