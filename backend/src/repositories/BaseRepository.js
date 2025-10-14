/**
 * Base Repository Class
 * Provides common database operations for all repository classes
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
    this.name = this.constructor.name;
  }

  /**
   * Find all documents
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, sort, limit, etc.)
   * @returns {Array} Array of documents
   */
  async findAll(filter = {}, options = {}) {
    try {
      let query = this.model.find(filter);
      
      if (options.populate) {
        if (Array.isArray(options.populate)) {
          options.populate.forEach(pop => query = query.populate(pop));
        } else {
          query = query.populate(options.populate);
        }
      }
      
      if (options.sort) {
        query = query.sort(options.sort);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.skip) {
        query = query.skip(options.skip);
      }
      
      return await query.exec();
    } catch (error) {
      console.error(`[${this.name}] Error in findAll:`, error);
      throw error;
    }
  }

  /**
   * Find document by ID
   * @param {string} id - Document ID
   * @param {Object} options - Query options
   * @returns {Object} Document
   */
  async findById(id, options = {}) {
    try {
      let query = this.model.findById(id);
      
      if (options.populate) {
        if (Array.isArray(options.populate)) {
          options.populate.forEach(pop => query = query.populate(pop));
        } else {
          query = query.populate(options.populate);
        }
      }
      
      return await query.exec();
    } catch (error) {
      console.error(`[${this.name}] Error in findById:`, error);
      throw error;
    }
  }

  /**
   * Find one document
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options
   * @returns {Object} Document
   */
  async findOne(filter, options = {}) {
    try {
      let query = this.model.findOne(filter);
      
      if (options.populate) {
        if (Array.isArray(options.populate)) {
          options.populate.forEach(pop => query = query.populate(pop));
        } else {
          query = query.populate(options.populate);
        }
      }
      
      return await query.exec();
    } catch (error) {
      console.error(`[${this.name}] Error in findOne:`, error);
      throw error;
    }
  }

  /**
   * Create a new document
   * @param {Object} data - Document data
   * @returns {Object} Created document
   */
  async create(data) {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      console.error(`[${this.name}] Error in create:`, error);
      throw error;
    }
  }

  /**
   * Update document by ID
   * @param {string} id - Document ID
   * @param {Object} updateData - Update data
   * @param {Object} options - Update options
   * @returns {Object} Updated document
   */
  async updateById(id, updateData, options = { new: true }) {
    try {
      return await this.model.findByIdAndUpdate(id, updateData, options);
    } catch (error) {
      console.error(`[${this.name}] Error in updateById:`, error);
      throw error;
    }
  }

  /**
   * Update one document
   * @param {Object} filter - MongoDB filter object
   * @param {Object} updateData - Update data
   * @param {Object} options - Update options
   * @returns {Object} Updated document
   */
  async updateOne(filter, updateData, options = { new: true }) {
    try {
      return await this.model.findOneAndUpdate(filter, updateData, options);
    } catch (error) {
      console.error(`[${this.name}] Error in updateOne:`, error);
      throw error;
    }
  }

  /**
   * Update many documents
   * @param {Object} filter - MongoDB filter object
   * @param {Object} updateData - Update data
   * @returns {Object} Update result
   */
  async updateMany(filter, updateData) {
    try {
      return await this.model.updateMany(filter, updateData);
    } catch (error) {
      console.error(`[${this.name}] Error in updateMany:`, error);
      throw error;
    }
  }

  /**
   * Delete document by ID
   * @param {string} id - Document ID
   * @returns {Object} Deleted document
   */
  async deleteById(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      console.error(`[${this.name}] Error in deleteById:`, error);
      throw error;
    }
  }

  /**
   * Delete one document
   * @param {Object} filter - MongoDB filter object
   * @returns {Object} Deleted document
   */
  async deleteOne(filter) {
    try {
      return await this.model.findOneAndDelete(filter);
    } catch (error) {
      console.error(`[${this.name}] Error in deleteOne:`, error);
      throw error;
    }
  }

  /**
   * Count documents
   * @param {Object} filter - MongoDB filter object
   * @returns {number} Document count
   */
  async count(filter = {}) {
    try {
      return await this.model.countDocuments(filter);
    } catch (error) {
      console.error(`[${this.name}] Error in count:`, error);
      throw error;
    }
  }

  /**
   * Check if document exists
   * @param {Object} filter - MongoDB filter object
   * @returns {boolean} Existence status
   */
  async exists(filter) {
    try {
      const count = await this.model.countDocuments(filter);
      return count > 0;
    } catch (error) {
      console.error(`[${this.name}] Error in exists:`, error);
      throw error;
    }
  }

  /**
   * Aggregate documents
   * @param {Array} pipeline - Aggregation pipeline
   * @returns {Array} Aggregation result
   */
  async aggregate(pipeline) {
    try {
      return await this.model.aggregate(pipeline);
    } catch (error) {
      console.error(`[${this.name}] Error in aggregate:`, error);
      throw error;
    }
  }
}

module.exports = BaseRepository;
