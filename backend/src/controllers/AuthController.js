const AuthService = require("../services/AuthService");
const BaseController = require("./BaseController");

/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 */
class AuthController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Register a new user
   */
  register = this.asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body;
    
    await this.handleServiceResponse(
      res,
      AuthService.registerUser({ username, email, password, role }),
      'Registration successful',
      201
    );
  });

  /**
   * Verify user email (with welcome notifications)
   */
  verify = this.asyncHandler(async (req, res) => {
    const { token } = req.query;
    
    if (!token) {
      return res.render('error', { message: 'Verification token is required' });
    }

    try {
      const result = await AuthService.verifyUserWithWelcome(token);
      
      if (result.success) {
        return res.redirect("/verified");
      } else {
        return res.render('error', { message: result.message });
      }
    } catch (error) {
      console.error('Verification error:', error);
      return res.render('error', { message: 'Verification failed' });
    }
  });

  /**
   * Login user (with home page rendering)
   */
  loginWithRender = this.asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    try {
      // Convert username to email for the service (assuming username is email)
      const result = await AuthService.loginUser({ email: username, password });
      
      if (result.success) {
        // Set session data
        req.session.userId = result.user.id;
        req.session.role = result.user.role;
        req.session.username = result.user.username;

        // Render home page with user data
        return res.render("home", { 
          layout: false, 
          user: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            role: result.user.role
          }
        });
      } else {
        return res.send(result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      return res.send("Invalid username or password");
    }
  });

  /**
   * Login user
   */
  login = this.asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const result = await AuthService.loginUser({ email, password });
      
      if (result.success) {
        // Set session data
        req.session.userId = result.user.id;
        req.session.role = result.user.role;
        req.session.username = result.user.username;
        
        return this.sendSuccess(res, {
          user: result.user,
          redirectUrl: result.user.role === 'buyer' ? '/listproduct' : '/view'
        }, result.message);
      } else {
        return this.sendError(res, result.message, 401);
      }
    } catch (error) {
      return this.sendError(res, error.message, 401);
    }
  });

  /**
   * Logout user
   */
  logout = this.asyncHandler(async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return this.sendError(res, 'Logout failed', 500);
      }
      return this.sendSuccess(res, null, 'Logged out successfully');
    });
  });

  /**
   * Get current user profile
   */
  getProfile = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Not authenticated', 401);
    }

    await this.handleServiceResponse(
      res,
      AuthService.getUserById(userId, role),
      'Profile retrieved successfully'
    );
  });

  /**
   * Middleware: Ensure user is buyer
   */
  ensureBuyer = this.asyncHandler(async (req, res, next) => {
    const { userId, role } = this.getUserSession(req);
    
    try {
      await AuthService.ensureBuyer(userId, role);
      next();
    } catch (error) {
      return res.status(403).render('error', { 
        message: error.message 
      });
    }
  });

  /**
   * Middleware: Ensure user is seller
   */
  ensureSeller = this.asyncHandler(async (req, res, next) => {
    const { userId, role } = this.getUserSession(req);
    
    try {
      await AuthService.ensureSeller(userId, role);
      next();
    } catch (error) {
      return res.status(403).render('error', { 
        message: error.message 
      });
    }
  });

  /**
   * Logout user (with redirect)
   */
  logoutWithRedirect = this.asyncHandler(async (req, res) => {
    req.session.destroy(() => res.redirect("/login"));
  });

  /**
   * Check authentication status
   */
  checkAuth = this.asyncHandler(async (req, res) => {
    const { userId, role, username } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Not authenticated', 401);
    }

    return this.sendSuccess(res, {
      authenticated: true,
      user: { id: userId, role, username }
    }, 'User is authenticated');
  });
}

module.exports = new AuthController();
