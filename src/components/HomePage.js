// src/components/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div>
            <h1>Welcome to the Home Page</h1>
            <Link to="/register">Register new account!</Link>
            <Link to="/login">Already have an account? Login here!</Link>
        </div>
    );
};

export default HomePage;