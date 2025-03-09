from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
from dotenv import load_dotenv
import os
from passlib.hash import pbkdf2_sha256
from openai import OpenAI
import httpx

# 加载环境变量
load_dotenv()

# 初始化OpenAI配置
client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY'),
    base_url="https://api.chatanywhere.tech/v1",
    http_client=httpx.Client(verify=False)
)

# 初始化Flask应用
app = Flask(__name__)

# 配置数据库连接
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', f"mysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

# 初始化扩展
db = SQLAlchemy(app)
migrate = Migrate(app, db)
CORS(app)
jwt = JWTManager(app)

# 用户模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

# AI对话历史模型
class ChatHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

# 错误处理
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

# 路由
@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/api/chat', methods=['POST'])
@jwt_required()
def chat():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'message' not in data:
        return jsonify({'error': 'Message is required'}), 400
    
    try:
        # 调用OpenAI API生成回复
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "你是一个友好的AI助手，可以帮助用户解答问题。"},
                {"role": "user", "content": data['message']}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        # 保存对话历史
        chat_history = ChatHistory(
            user_id=user_id,
            message=data['message'],
            response=ai_response
        )
        db.session.add(chat_history)
        db.session.commit()
        
        return jsonify({
            'response': ai_response
        })
    except Exception as e:
        return jsonify({'error': f'AI响应生成失败: {str(e)}'}), 500

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': '用户名和密码都是必需的'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': '用户名已存在'}), 400
    
    hashed_password = pbkdf2_sha256.hash(data['password'])
    user = User(username=data['username'], password=hashed_password)
    
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({'message': '注册成功'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '注册失败'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': '用户名和密码都是必需的'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    if not user or not pbkdf2_sha256.verify(data['password'], user.password):
        return jsonify({'error': '用户名或密码错误'}), 401
    
    access_token = create_access_token(identity=user.id)
    return jsonify({
        'token': access_token,
        'user': {'id': user.id, 'username': user.username}
    })

@app.route('/api/chat/history', methods=['GET'])
@jwt_required()
def get_chat_history():
    user_id = get_jwt_identity()
    chat_history = ChatHistory.query.filter_by(user_id=user_id).order_by(ChatHistory.created_at.desc()).all()
    
    return jsonify({
        'history': [{
            'id': chat.id,
            'message': chat.message,
            'response': chat.response,
            'created_at': chat.created_at.isoformat()
        } for chat in chat_history]
    })

if __name__ == '__main__':
    app.run(debug=True)