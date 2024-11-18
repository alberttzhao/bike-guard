const Bike = require('../models/Bike');  // Assuming the Bike model is defined and connected to your database
const logger = require('../utils/logger');  // Assuming a custom logger utility for logging errors and actions

// Utility function to handle error responses
const handleErrorResponse = (res, err, customMessage) => {
  logger.error(customMessage, err);  // Log the error
  res.status(500).json({
    success: false,
    message: customMessage,
    error: err.message
  });
};

// Utility function to send a success response
const handleSuccessResponse = (res, data, message = 'Success') => {
  res.status(200).json({
    success: true,
    message,
    data
  });
};

// Get all bikes from the database
exports.getAllBikes = async (req, res) => {
  try {
    const bikes = await Bike.find();  // Fetch all bikes from the database
    handleSuccessResponse(res, bikes);  // Return the bikes in JSON format with a 200 OK status
  } catch (err) {
    handleErrorResponse(res, err, 'Failed to fetch bikes');
  }
};

// Get a specific bike by ID
exports.getBikeById = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);  // Fetch bike by ID
    if (!bike) {
      return res.status(404).json({
        success: false,
        message: 'Bike not found'
      });
    }
    handleSuccessResponse(res, bike);  // Return the bike details
  } catch (err) {
    handleErrorResponse(res, err, `Error fetching bike with ID ${req.params.id}`);
  }
};

// Create a new bike in the database
exports.createBike = async (req, res) => {
  const { brand, model, year, price } = req.body;

  // Input validation
  if (!brand || !model || !year || !price) {
    return res.status(400).json({
      success: false,
      message: 'All fields (brand, model, year, price) are required'
    });
  }

  try {
    const newBike = new Bike({ brand, model, year, price });
    await newBike.save();  // Save the new bike to the database
    handleSuccessResponse(res, newBike, 'Bike created successfully');  // Return the newly created bike
  } catch (err) {
    handleErrorResponse(res, err, 'Failed to create bike');
  }
};

// Update an existing bike in the database
exports.updateBike = async (req, res) => {
  try {
    const bike = await Bike.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: 'Bike not found'
      });
    }

    handleSuccessResponse(res, bike, 'Bike updated successfully');  // Return the updated bike
  } catch (err) {
    handleErrorResponse(res, err, `Error updating bike with ID ${req.params.id}`);
  }
};

// Delete a bike from the database
exports.deleteBike = async (req, res) => {
  try {
    const bike = await Bike.findByIdAndDelete(req.params.id);  // Delete bike by ID

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: 'Bike not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bike deleted successfully'
    });  // Return success message
  } catch (err) {
    handleErrorResponse(res, err, `Error deleting bike with ID ${req.params.id}`);
  }
};
