// pages/AddProduct.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/constants';
import './AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    category: 'Software',
    status: 'Idea',
    url: '',
    tags: []
  });
  
  const [newTag, setNewTag] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Product added successfully!');
        navigate(`/founder/${localStorage.getItem('founderId')}`);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error adding product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddTag = () => {
    if (newTag.trim() && !productData.tags.includes(newTag.trim())) {
      setProductData({
        ...productData,
        tags: [...productData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };
  
  return (
    <div className="add-product-container">
      <div className="add-product-header">
        <h1>Add Your Product/Service</h1>
        <p>Showcase what you're building to attract collaborators and customers</p>
      </div>
      
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label>Product/Service Name *</label>
          <input
            type="text"
            value={productData.name}
            onChange={(e) => setProductData({...productData, name: e.target.value})}
            required
            placeholder="e.g., AI-powered Study Assistant"
          />
        </div>
        
        <div className="form-group">
          <label>Description *</label>
          <textarea
            value={productData.description}
            onChange={(e) => setProductData({...productData, description: e.target.value})}
            required
            rows={4}
            placeholder="Describe what your product does, who it's for, and what problem it solves..."
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select
              value={productData.category}
              onChange={(e) => setProductData({...productData, category: e.target.value})}
            >
              <option value="Software">Software</option>
              <option value="Hardware">Hardware</option>
              <option value="Service">Service</option>
              <option value="App">Mobile App</option>
              <option value="Website">Website</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Current Status</label>
            <select
              value={productData.status}
              onChange={(e) => setProductData({...productData, status: e.target.value})}
            >
              <option value="Idea">Just an Idea</option>
              <option value="Prototype">Prototype</option>
              <option value="Beta">Beta Testing</option>
              <option value="Launched">Launched</option>
              <option value="Scaling">Scaling</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Website/App Store URL (Optional)</label>
          <input
            type="url"
            value={productData.url}
            onChange={(e) => setProductData({...productData, url: e.target.value})}
            placeholder="https://yourproduct.com"
          />
        </div>
        
        <div className="form-group">
          <label>Tags</label>
          <div className="tags-input">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add a tag and press Enter"
            />
            <button type="button" onClick={handleAddTag}>Add</button>
          </div>
          <div className="tags-container">
            {productData.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
                <button
                  type="button"
                  onClick={() => setProductData({
                    ...productData,
                    tags: productData.tags.filter(t => t !== tag)
                  })}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;