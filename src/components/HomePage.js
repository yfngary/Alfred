import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/home.css'; // Import the new home.css file

const HomePage = () => {
    return (
        <div className="home-container">
            <h2>Welcome to Alfred</h2>
            <div className="buttom-sections">
                <Link to="/register" className="home-button">Register new account!</Link>
            </div>
            <div>
                <Link to="/login" className="home-button">Already have an account? Login here!</Link>
            </div>
        </div>
    );
};

export default HomePage;
