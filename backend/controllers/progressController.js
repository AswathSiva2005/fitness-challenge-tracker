const Progress = require("../models/Progress");

// Create new progress entry
exports.createProgress = async (req, res) => {
  console.log('\n=== New Progress Request ===');
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { userId, weight, bodyFat, chest, waist, notes, measurementDate } = req.body;

    // Basic validation
    if (!userId) {
      console.error('Validation Error: User ID is required');
      return res.status(400).json({ 
        success: false,
        error: "User ID is required" 
      });
    }

    if (!weight || isNaN(weight) || weight <= 0) {
      console.error('Validation Error: Invalid weight');
      return res.status(400).json({ 
        success: false,
        error: "Valid weight is required" 
      });
    }

    // Prepare progress data
    const progressData = {
      userId,
      weight: parseFloat(weight),
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      chest: chest ? parseFloat(chest) : undefined,
      waist: waist ? parseFloat(waist) : undefined,
      notes: notes || "",
      measurementDate: measurementDate || new Date()
    };
    
    console.log('Creating progress with data:', JSON.stringify(progressData, null, 2));

    // Create progress entry
    const progress = await Progress.create(progressData);
    console.log('Progress created successfully:', JSON.stringify(progress, null, 2));

    res.status(201).json({
      success: true,
      data: progress,
      message: "Progress saved successfully"
    });

  } catch (err) {
    console.error("Progress Save Error:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to save progress. Please try again.",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    console.log('=== End of Progress Request ===\n');
  }
};

// Get all progress entries for a user
exports.getProgress = async (req, res) => {
  console.log('\n=== Get Progress Request ===');
  console.log('Query params:', req.query);
  
  try {
    const { userId } = req.query;
    
    if (!userId) {
      console.error('Validation Error: User ID is required');
      return res.status(400).json({ 
        success: false,
        error: "User ID is required" 
      });
    }
    
    console.log(`Fetching progress for user: ${userId}`);
    
    const progress = await Progress.find({ userId })
      .sort({ measurementDate: -1 });
      
    console.log(`Found ${progress.length} progress entries`);
    
    res.status(200).json({
      success: true,
      count: progress.length,
      data: progress
    });
  } catch (err) {
    console.error("Error fetching progress:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch progress data",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    console.log('=== End of Get Progress Request ===\n');
  }
};

// Get progress summary for dashboard
exports.getProgressSummary = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const progress = await Progress.find({ userId })
      .sort({ measurementDate: -1 })
      .limit(10); // Get last 10 entries

    if (progress.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: "No progress data found"
      });
    }

    // Calculate changes from previous entry if available
    let weightChange = null;
    let bodyFatChange = null;
    
    if (progress.length > 1) {
      const current = progress[0];
      const previous = progress[1];
      
      weightChange = {
        value: current.weight - previous.weight,
        percentage: ((current.weight - previous.weight) / previous.weight) * 100
      };
      
      if (current.bodyFat && previous.bodyFat) {
        bodyFatChange = {
          value: current.bodyFat - previous.bodyFat,
          percentage: ((current.bodyFat - previous.bodyFat) / previous.bodyFat) * 100
        };
      }
    }

    res.json({
      success: true,
      data: {
        latest: progress[0],
        previous: progress.length > 1 ? progress[1] : null,
        history: progress,
        changes: {
          weight: weightChange,
          bodyFat: bodyFatChange
        }
      }
    });

  } catch (err) {
    console.error("Progress Summary Error:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch progress summary" 
    });
  }
};
