// 热门景点页面逻辑
class DestinationsPage {
    constructor() {
        this.destinations = this.getSampleDestinations();
        this.filteredDestinations = [...this.destinations];
        this.init();
    }

    init() {
        this.renderDestinations();
        this.setupEventListeners();
    }

    getSampleDestinations() {
        return [
            {
                id: 1,
                name: "故宫博物院",
                location: "北京, 中国",
                description: "世界上现存规模最大、保存最为完整的木质结构古建筑群",
                type: "architecture",
                region: "asia",
                icon: "🏯",
                tags: ["历史建筑", "文化遗产", "皇家宫殿"]
            },
            {
                id: 2,
                name: "埃菲尔铁塔",
                location: "巴黎, 法国",
                description: "法国文化象征，世界著名铁制镂空塔",
                type: "architecture",
                region: "europe",
                icon: "🗼",
                tags: ["现代建筑", "城市地标", "浪漫景点"]
            },
            {
                id: 3,
                name: "大堡礁",
                location: "昆士兰, 澳大利亚",
                description: "世界最大最长的珊瑚礁群，自然奇观",
                type: "nature",
                region: "oceania",
                icon: "🐠",
                tags: ["自然奇观", "海洋生物", "潜水胜地"]
            },
            {
                id: 4,
                name: "泰姬陵",
                location: "阿格拉, 印度",
                description: "印度穆斯林艺术最完美的瑰宝，世界文化遗产",
                type: "architecture",
                region: "asia",
                icon: "🕌",
                tags: ["爱情象征", "大理石建筑", "世界奇迹"]
            },
            {
                id: 5,
                name: "尼亚加拉瀑布",
                location: "安大略, 加拿大",
                description: "世界三大跨国瀑布之一，气势磅礴",
                type: "nature",
                region: "america",
                icon: "💧",
                tags: ["自然瀑布", "壮观景色", "旅游热点"]
            },
            {
                id: 6,
                name: "罗马斗兽场",
                location: "罗马, 意大利",
                description: "古罗马时期最大的圆形角斗场",
                type: "culture",
                region: "europe",
                icon: "🏛️",
                tags: ["古罗马遗址", "历史遗迹", "建筑奇迹"]
            },
            {
                id: 7,
                name: "东京塔",
                location: "东京, 日本",
                description: "日本第二高结构物，城市象征",
                type: "modern",
                region: "asia",
                icon: "📡",
                tags: ["现代地标", "观景台", "城市夜景"]
            },
            {
                id: 8,
                name: "马丘比丘",
                location: "库斯科, 秘鲁",
                description: "前哥伦布时期印加帝国的著名遗迹",
                type: "culture",
                region: "america",
                icon: "⛰️",
                tags: ["印加遗址", "世界遗产", "神秘古城"]
            },
            {
                id: 9,
                name: "悉尼歌剧院",
                location: "悉尼, 澳大利亚",
                description: "20世纪最具特色的建筑之一，世界著名的表演艺术中心",
                type: "architecture",
                region: "oceania",
                icon: "🎭",
                tags: ["现代建筑", "艺术中心", "海滨地标"]
            },
            {
                id: 10,
                name: "金字塔",
                location: "吉萨, 埃及",
                description: "古埃及法老的陵墓，世界古代七大奇迹之一",
                type: "culture",
                region: "africa",
                icon: "🔺",
                tags: ["古代奇迹", "法老陵墓", "神秘建筑"]
            },
            {
                id: 11,
                name: "富士山",
                location: "静冈/山梨, 日本",
                description: "日本最高峰，活火山，日本重要象征",
                type: "nature",
                region: "asia",
                icon: "🗻",
                tags: ["活火山", "登山胜地", "自然景观"]
            },
            {
                id: 12,
                name: "布拉格广场",
                location: "布拉格, 捷克",
                description: "欧洲最美丽的广场之一，哥特式建筑集中地",
                type: "architecture",
                region: "europe",
                icon: "🏰",
                tags: ["历史广场", "哥特建筑", "浪漫城市"]
            }
        ];
    }

    renderDestinations() {
        const container = document.getElementById('destinations-showcase');
        if (!container) return;

        container.innerHTML = this.filteredDestinations.map(destination => `
            <div class="destination-card" onclick="destinationsPage.viewDestination(${destination.id})">
                <div class="destination-image">
                    ${destination.icon}
                </div>
                <div class="destination-content">
                    <h3 class="destination-title">${destination.name}</h3>
                    <div class="destination-location">📍 ${destination.location}</div>
                    <p class="destination-description">${destination.description}</p>
                    <div class="destination-tags">
                        ${destination.tags.map(tag => `<span class="destination-tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        const searchInput = document.querySelector('#destinations .search-input');
        const regionFilter = document.getElementById('region-filter');
        const typeFilter = document.getElementById('type-filter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterDestinations(e.target.value, regionFilter.value, typeFilter.value);
            });
        }

        if (regionFilter) {
            regionFilter.addEventListener('change', (e) => {
                this.filterDestinations(searchInput.value, e.target.value, typeFilter.value);
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filterDestinations(searchInput.value, regionFilter.value, e.target.value);
            });
        }
    }

    filterDestinations(searchTerm = '', region = '', type = '') {
        this.filteredDestinations = this.destinations.filter(destination => {
            const matchesSearch = !searchTerm || 
                destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                destination.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                destination.description.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesRegion = !region || destination.region === region;
            const matchesType = !type || destination.type === type;
            
            return matchesSearch && matchesRegion && matchesType;
        });

        this.renderDestinations();
    }

    viewDestination(destinationId) {
        const destination = this.destinations.find(d => d.id === destinationId);
        if (destination) {
            alert(`查看景点详情：${destination.name}\n\n位置：${destination.location}\n描述：${destination.description}`);
            // 在实际应用中，这里可以跳转到详细的景点页面或显示模态框
        }
    }
}

// 初始化景点页面
let destinationsPage;

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('destinations-showcase')) {
        destinationsPage = new DestinationsPage();
    }
});