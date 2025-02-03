// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import HomePage from './components/HomePage'; // Assuming you have a home page
import LoginPage from './components/LoginPage';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/register" element={<RegistrationForm />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<HomePage />} />
            </Routes>
        </Router>
    );
};

export default App;
