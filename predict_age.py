import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
import warnings
import argparse
import joblib


parser = argparse.ArgumentParser()
parser.add_argument('--kich_thuoc', type=str)
parser.add_argument('--chieu_dai', type=int)
parser.add_argument('--chu_vi', type=int)
parser.add_argument('--mau_sac', type=str)
parser.add_argument('--chat_lieu', type=str)
parser.add_argument('--kieu_dang', type=str)
parser.add_argument('--phu_kien', type=str)
parser.add_argument('--hoa_tiet', type=str)
parser.add_argument('--do_day', type=str)
parser.add_argument('--tinh_nang_dac_biet', type=str)
args = parser.parse_args()

warnings.filterwarnings("ignore", category=UserWarning)

data = pd.read_csv('clothing_dataset.csv')


label_encoders = {}
for column in data.columns[:-1]:
    if data[column].dtype == 'object':
        le = LabelEncoder()
        data[column] = le.fit_transform(data[column])
        label_encoders[column] = le


le_age = LabelEncoder()
data['Lứa_tuổi'] = le_age.fit_transform(data['Lứa_tuổi'])


X = data.drop('Lứa_tuổi', axis=1)
y = data['Lứa_tuổi']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train[['Chiều_dài', 'Chu_vi']] = scaler.fit_transform(X_train[['Chiều_dài', 'Chu_vi']])
X_test[['Chiều_dài', 'Chu_vi']] = scaler.transform(X_test[['Chiều_dài', 'Chu_vi']])

param_grid = {
    'max_depth': [None, 10, 20, 30],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4],
    'criterion': ['gini', 'entropy']
}

grid_search = GridSearchCV(DecisionTreeClassifier(random_state=42), param_grid, cv=5, scoring='accuracy')
grid_search.fit(X_train, y_train)

best_model = grid_search.best_estimator_

y_pred = best_model.predict(X_test)


def predict_age_category(new_data):
    input_data = []
    for column in X.columns:
        value = new_data[column]
        if column in label_encoders:
            value = label_encoders[column].transform([value])[0]
        input_data.append(value)
    
    input_data[1:3] = scaler.transform([input_data[1:3]])[0]
    
    prediction = best_model.predict([input_data])
    return le_age.inverse_transform(prediction)[0]

sản_phẩm_mới = {
    'Kích_thước': args.kich_thuoc,
    'Chiều_dài': args.chieu_dai,
    'Chu_vi': args.chu_vi,
    'Màu_sắc': args.mau_sac,
    'Chất_liệu': args.chat_lieu,
    'Kiểu_dáng': args.kieu_dang,
    'Họa_tiết': args.hoa_tiet,
    'Phụ_kiện': args.phu_kien,
    'Độ_dày': args.do_day,
    'Tính_năng_đặc_biệt': args.tinh_nang_dac_biet
}

lứa_tuổi_dự_đoán = predict_age_category(sản_phẩm_mới)
print(lứa_tuổi_dự_đoán)
