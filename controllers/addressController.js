import Address from '../models/Address.js';

// @desc    Add new address
// @route   POST /api/addresses
// @access  Private
export const addAddress = async (req, res) => {
    console.log("User from token:", req.user); // Log the user object
  
    try {
      const address = new Address({
        userId: req.user.userId, // Use userId instead of _id
        ...req.body,
      });
  
      const savedAddress = await address.save();
      
      // Return a success message along with the saved address
      res.status(201).json({
        message: 'Address added successfully!',
        data: savedAddress
      });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };
// @desc    Get logged-in user's address
// @route   GET /api/addresses
// @access  Private
export const getAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ userId: req.user._id });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    res.json(address);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const updatedAddress = await Address.findOneAndUpdate(
      { userId: req.user._id, _id: req.params.id },
      req.body,
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json(updatedAddress);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const deleted = await Address.findOneAndDelete({ userId: req.user._id, _id: req.params.id });

    if (!deleted) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
