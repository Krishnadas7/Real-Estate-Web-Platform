// Get public configuration (including Google Maps API key)
export const getPublicConfig = async (req, res) => {
  try {
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    
    return res.status(200).json({
      success: true,
      data: {
        googleMapsApiKey: googleMapsApiKey,
        // Add other public config here if needed
      }
    });
  } catch (error) {
    console.error('Error fetching public config:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching configuration'
    });
  }
};

