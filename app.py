from flask import Flask, render_template, request, jsonify
import plotly
import plotly.graph_objects as go
import numpy as np
import json
import random
from scipy import stats

app = Flask(__name__)

def generate_distribution():
    """Генерирует случайное распределение и вычисляет статистики"""
    distribution_type = random.choice(['normal', 'skewed', 'bimodal', 'different_heights'])
    
    if distribution_type == 'normal':
        data = np.random.normal(0, 1, 1000)
    elif distribution_type == 'skewed':
        data = np.random.exponential(2, 1000) - 2
    elif distribution_type == 'bimodal':
        data1 = np.random.normal(-2, 1, 500)
        data2 = np.random.normal(2, 1, 500)
        data = np.concatenate([data1, data2])
    else:  # different_heights
        data1 = np.random.normal(-1, 0.8, 300)
        data2 = np.random.normal(2, 1, 700)
        data = np.concatenate([data1, data2])
    
    # Вычисляем плотность
    kde = stats.gaussian_kde(data)
    x = np.linspace(min(data) - 1, max(data) + 1, 1000)
    y = kde(x)
    
    # Вычисляем статистики
    mean = np.mean(data)
    median = np.median(data)
    mode_index = np.argmax(y)
    mode = x[mode_index]
    
    return x, y, mean, median, mode

@app.route('/')
def index():
    """Главная страница"""
    return render_template('index.html')

@app.route('/get_plot')
def get_plot():
    """Генерирует новый график со статистиками"""
    x, y, mean, median, mode = generate_distribution()
    
    # Создаем график
    fig = go.Figure()
    
    # Основной график плотности
    fig.add_trace(go.Scatter(x=x, y=y, mode='lines', name='Плотность', 
                           line=dict(color='black', width=2)))
    
    # Случайным образом распределяем цвета для статистик
    colors = ['red', 'blue', 'green']
    random.shuffle(colors)
    color_map = {
        'mean': colors[0],
        'median': colors[1],
        'mode': colors[2]
    }
    
    # Добавляем вертикальные линии для статистик
    fig.add_trace(go.Scatter(x=[mean, mean], y=[0, max(y)*1.1], 
                           mode='lines', name='Среднее', 
                           line=dict(color=color_map['mean'], width=3, dash='dash')))
    
    fig.add_trace(go.Scatter(x=[median, median], y=[0, max(y)*1.1], 
                           mode='lines', name='Медиана', 
                           line=dict(color=color_map['median'], width=3, dash='dash')))
    
    fig.add_trace(go.Scatter(x=[mode, mode], y=[0, max(y)*1.1], 
                           mode='lines', name='Мода', 
                           line=dict(color=color_map['mode'], width=3, dash='dash')))
    
    fig.update_layout(
        title="Определите моду, медиану и среднее",
        xaxis_title="Значение",
        yaxis_title="Плотность вероятности",
        showlegend=False,
        height=500
    )
    
    # Преобразуем график в JSON
    graphJSON = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
    
    return jsonify({
        'graph': graphJSON,
        'colors': color_map
    })

@app.route('/check_answer', methods=['POST'])
def check_answer():
    """Проверяет ответ пользователя"""
    user_answers = request.json
    correct_answers = request.json.get('correct_answers')
    
    # Проверяем все ответы
    all_correct = True
    for stat, color in correct_answers.items():
        if user_answers.get(stat) != color:
            all_correct = False
            break
    
    if all_correct:
        return jsonify({'result': 'Верно, молодец!!'})
    else:
        return jsonify({'result': 'Неверно:(( Обнови сайт и попробуй еще раз!'})

if __name__ == '__main__':
    app.run(debug=True)
