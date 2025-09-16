class DistributionGenerator {
    static generateNormal(mean = 0, std = 1, n = 1000) {
        const data = [];
        for (let i = 0; i < n; i++) {
            let u = 0, v = 0;
            while(u === 0) u = Math.random();
            while(v === 0) v = Math.random();
            const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
            data.push(mean + std * z);
        }
        return data;
    }

    static generateExponential(lambda = 2, n = 1000) {
        const data = [];
        for (let i = 0; i < n; i++) {
            data.push(-Math.log(1 - Math.random()) / lambda - 2);
        }
        return data;
    }

    static generateBimodal(n = 1000) {
        const data1 = this.generateNormal(-2, 1, n/2);
        const data2 = this.generateNormal(2, 1, n/2);
        return data1.concat(data2);
    }

    static generateDifferentHeights(n = 1000) {
        const data1 = this.generateNormal(-1, 0.8, n * 0.3);
        const data2 = this.generateNormal(2, 1, n * 0.7);
        return data1.concat(data2);
    }

    static kde(data, bandwidth = 0.2) {
        const x = Array.from({length: 1000}, (_, i) => {
            const min = Math.min(...data) - 1;
            const max = Math.max(...data) + 1;
            return min + (max - min) * i / 1000;
        });

        const y = x.map(xi => {
            let sum = 0;
            for (const d of data) {
                const u = (xi - d) / bandwidth;
                sum += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
            }
            return sum / (data.length * bandwidth);
        });

        return {x, y};
    }

    static generateDistribution() {
        const types = ['normal', 'skewed', 'bimodal', 'different_heights'];
        const type = types[Math.floor(Math.random() * types.length)];

        let data;
        switch(type) {
            case 'normal':
                data = this.generateNormal();
                break;
            case 'skewed':
                data = this.generateExponential();
                break;
            case 'bimodal':
                data = this.generateBimodal();
                break;
            case 'different_heights':
                data = this.generateDifferentHeights();
                break;
        }

        const {x, y} = this.kde(data);
        
        // Вычисляем статистики
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        
        const sorted = [...data].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0 
            ? (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2
            : sorted[Math.floor(sorted.length/2)];
        
        const modeIndex = y.indexOf(Math.max(...y));
        const mode = x[modeIndex];

        return {x, y, mean, median, mode};
    }
}

class StatisticsQuiz {
    constructor() {
        this.correctAnswers = {};
        this.init();
    }

    init() {
        this.generatePlot();
        this.setupEventListeners();
    }

    generatePlot() {
        const {x, y, mean, median, mode} = DistributionGenerator.generateDistribution();

        // Случайным образом распределяем цвета
        const colors = ['red', 'blue', 'green'];
        this.shuffleArray(colors);
        
        this.correctAnswers = {
            'mean': colors[0],
            'median': colors[1],
            'mode': colors[2]
        };

        const traces = [
            {
                x: x,
                y: y,
                mode: 'lines',
                name: 'Плотность',
                line: {color: 'black', width: 2}
            },
            {
                x: [mean, mean],
                y: [0, Math.max(...y) * 1.1],
                mode: 'lines',
                name: 'Среднее',
                line: {color: colors[0], width: 3, dash: 'dash'}
            },
            {
                x: [median, median],
                y: [0, Math.max(...y) * 1.1],
                mode: 'lines',
                name: 'Медиана',
                line: {color: colors[1], width: 3, dash: 'dash'}
            },
            {
                x: [mode, mode],
                y: [0, Math.max(...y) * 1.1],
                mode: 'lines',
                name: 'Мода',
                line: {color: colors[2], width: 3, dash: 'dash'}
            }
        ];

        const layout = {
            title: "Определите моду, медиану и среднее",
            xaxis: {title: "Значение"},
            yaxis: {title: "Плотность вероятности"},
            showlegend: false,
            height: 500
        };

        Plotly.newPlot('plot-container', traces, layout);
        
        // Очищаем предыдущие результаты
        document.getElementById('result').textContent = '';
        document.getElementById('result').className = '';
        
        // Сбрасываем форму
        document.getElementById('answer-form').reset();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    checkAnswers(userAnswers) {
        const correctMap = {};
        Object.entries(this.correctAnswers).forEach(([stat, color]) => {
            correctMap[color] = stat;
        });

        for (const [color, userAnswer] of Object.entries(userAnswers)) {
            if (correctMap[color] !== userAnswer) {
                return false;
            }
        }
        return true;
    }

    setupEventListeners() {
        document.getElementById('answer-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const userAnswers = {
                'red': formData.get('red'),
                'blue': formData.get('blue'),
                'green': formData.get('green')
            };

            const isCorrect = this.checkAnswers(userAnswers);
            const resultElement = document.getElementById('result');
            
            if (isCorrect) {
                resultElement.textContent = 'Верно, молодец!!';
                resultElement.className = 'correct';
            } else {
                resultElement.textContent = 'Неверно:(( Попробуй еще раз!';
                resultElement.className = 'incorrect';
            }
        });

        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.generatePlot();
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new StatisticsQuiz();
});
