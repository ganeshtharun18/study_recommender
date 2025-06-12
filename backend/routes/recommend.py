from flask import Blueprint, request, jsonify
from utils.recommender import recommend_materials
from typing import List, Dict, Any

bp = Blueprint('recommend', __name__, url_prefix='/api/recommend')

@bp.route('/', methods=['POST'])
def get_recommendations():
    try:
        # Get and validate JSON
        if not request.is_json:
            return jsonify({
                "error": "Request must be JSON",
                "received_content_type": request.content_type
            }), 400

        data: Dict[str, Any] = request.get_json()
        if not data:
            return jsonify({"error": "Empty JSON body"}), 400

        # Accept both 'query' and 'topic' parameters
        query: str = data.get('query', '') or data.get('topic', '')
        if not query.strip():
            return jsonify({
                "error": "Either 'query' or 'topic' parameter is required",
                "received_data": data  # For debugging
            }), 400

        # Get recommendations
        results = recommend_materials(query)
        
        return jsonify({
            "data": results,
            "status": "success",
            "query_used": query  # For client verification
        })

    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "error",
            "endpoint_info": "POST /api/recommend/ with JSON {query: 'your topic'}"
        }), 500