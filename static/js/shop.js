window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('categoryId');
    const page = urlParams.get('page') || 0;

    if (categoryId) {
        fetchProductsByCategory(categoryId, page);
    } else {
        fetchAllProducts(page);
    }
});

function fetchAllProducts(page = 0) {
    fetch(`http://localhost:9056/product-service/api/products/listProductPage?page=${page}&size=12`)
        .then(response => response.json())
        .then(data => {
            renderProducts(data.content);
            renderPagination(data);
        })
        .catch(error => console.error('Lỗi:', error));
}

function fetchProductsByCategory(categoryId, page = 0) {
    fetch(`http://localhost:9056/product-service/api/products/by-category-page?categoryId=${categoryId}&page=${page}&size=12`)
        .then(response => response.json())
        .then(data => {
            renderProducts(data.content);
            renderPagination(data);
        })
        .catch(error => console.error('Lỗi:', error));
}

function renderProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    products.forEach(item => {
        const productCard = `
            <div class="col">
                <div class="product-card">
                    <div class="product-media">
                        <div class="product-label">
                            <label class="label-text sale">-${item.discount}%</label>
                        </div>
                        
                        <!-- Nút yêu thích -->
                        ${item.favorite
                ? `<button class="product-wish" style="color: #fd7e14;">
                                    <i class="fas fa-heart"></i>
                               </button>`
                : `<button class="product-wish">
                                    <i class="fas fa-heart"></i>
                               </button>`}

                        <!-- Hình ảnh sản phẩm -->
                        <a class="product-image" href="javascript:void(0);">
                           <img src="${item.imageUrl}" alt="${item.productName}" />
                        </a>

                        <!-- Widget -->
                        <div class="product-widget">
                            <a title="Video về sản phẩm" href="https://youtu.be/9xzcVxSBbG8" 
                                class="venobox fas fa-play" data-autoplay="true" data-vbtype="video">
                            </a>
                            <a title="Chi tiết sản phẩm" href="/templates/web/productDetail.html?productId=${item.productId}"" 
                                class="fas fa-eye">
                            </a>
                        </div>
                    </div>

                    <!-- Nội dung sản phẩm -->
                    <div class="product-content">
                        <h6 class="product-name">
                            <a href="javascript:void(0);">${item.productName}</a>
                        </h6>
                        <h6 class="product-price">
                            <del>${formatCurrency(item.price)} đ</del>
                            <span>${formatCurrency(item.price - (item.price * item.discount / 100))} đ</span>
                        </h6>

                        <!-- Trạng thái sản phẩm -->
                        ${item.quantity > 0
							? `<a class="product-add1" title="Thêm giỏ hàng" onclick="addToCart(${item.productId}, ${item.discount > 0 ? item.price - (item.price * item.discount / 100) : item.price})">
                                    <i class="fas fa-shopping-basket"></i><span>Thêm giỏ hàng</span>
                                </a>`
							: `<a class="product-add2"> 
                                    <i class="fas fa-shopping-basket"></i><span>Hết hàng</span>
                                </a>`
                        }
                    </div>
                </div>
            </div>
        `;
        productList.insertAdjacentHTML('beforeend', productCard);
    });
}

// Hàm sản phẩm vô giỏ hàng
async function addToCart(productId, price) {
    try {
        // Lấy token từ localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
            return;
        }

        // Gọi API lấy thông tin userId
        const userInfoResponse = await fetch('http://localhost:9056/user-service/api/profile/infor', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!userInfoResponse.ok) {
            throw new Error('Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.');
        }

        const userInfo = await userInfoResponse.json();
        const userId = userInfo.userId;

        if (!userId) {
            alert('Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.');
            return;
        }

        // Tạo body cho request thêm vào giỏ hàng
        const cartItemRequest = {
            productId: productId,
            quantity: 1,  // Mặc định thêm 1 sản phẩm vào giỏ hàng
            price: price  // Giá sản phẩm
        };

        // Gọi API thêm sản phẩm vào giỏ hàng
        const addToCartResponse = await fetch(`http://localhost:9056/order-service/api/cart/add-item/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(cartItemRequest)
        });

        if (!addToCartResponse.ok) {
            const errorText = await addToCartResponse.text();
            throw new Error(`Lỗi khi thêm sản phẩm vào giỏ hàng: ${errorText}`);
        }

        // Sau khi thêm vào giỏ hàng, reload lại trang
        setTimeout(function () {
            window.location.reload();
        }, 300);

    } catch (error) {
        console.error('Lỗi:', error);
        alert(error.message);
    }
}

// Hàm định dạng giá tiền
function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN').format(value);
}

function renderPagination(pageData) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    for (let i = 0; i < pageData.totalPages; i++) {
        const pageLink = `
            <a href="?page=${i}" class="pagination-link ${i === pageData.number ? 'active' : ''}">
                ${i + 1}
            </a>
        `;
        pagination.insertAdjacentHTML('beforeend', pageLink);
    }

}
