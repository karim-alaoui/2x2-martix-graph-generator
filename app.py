from flask import Flask, render_template, request, jsonify
import uuid

app = Flask(__name__)

# In-memory store for items
items = []

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/get_items', methods=['GET'])
def get_items():
    return jsonify(items)

@app.route('/add_item', methods=['POST'])
def add_item():
    data = request.json
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    name  = data.get('name', '').strip()
    x_val = data.get('x', 50)
    y_val = data.get('y', 50)
    color = data.get('color', '#000000')

    if not name:
        return jsonify({'success': False, 'error': 'Invalid name'}), 400

    item_id = str(uuid.uuid4())
    items.append({
        'name': name,
        'x': x_val,
        'y': y_val,
        'color': color,
        'id': item_id
    })
    return jsonify({'success': True, 'items': items})

@app.route('/delete_item', methods=['POST'])
def delete_item():
    global items
    req = request.json
    item_id = req.get('id')
    if not item_id:
        return jsonify({'success': False, 'error': 'No ID provided'}), 400

    items = [item for item in items if item['id'] != item_id]
    return jsonify({'success': True, 'items': items})

@app.route('/clear_all', methods=['POST'])
def clear_all():
    global items
    items = []
    return jsonify({'success': True, 'items': items})

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
