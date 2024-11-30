const categoryModel = require("../models/categoryModels");
const itemModel = require("../models/itemModels");
const { exec } = require('child_process');
const { promisify } = require('util');
const oderModel = require("../models/oderModels");
const customerModel = require("../models/customerModel");
const execPromise = promisify(exec);

class ItemController {
    async get(req, res) {
        try {
            const keySearch = req.query.keySearch;
            const email = req.query.userEmail;
            console.log("test email", email)
            const orderHistories = (await oderModel.find({
            }).populate({
                path: 'customer',
                match: {
                    email: email
                }
            }).populate({
                path: 'oder_list.item'
            })
            ).filter(order => order.customer);
            const ageCount = {
                "Trẻ sơ sinh": 0,
                "Trẻ tập đi": 0,
                "Thiếu nhi": 0,
                "Thiếu niên": 0,
                "Người lớn": 0,
            }

            orderHistories.forEach((order) => {
                order?.oder_list?.forEach((item) => {
                    if (item?.item?.age) {
                        ageCount[item?.item?.age] += 1
                    }
                })
            })
            console.log("Hanh test age count", ageCount);

            let ageMax = "Người lớn";
            let ageMaxCount = 0;
            Object.keys(ageCount).forEach((key) => {
                if (ageCount[key] > ageMaxCount) {
                    ageMax = key;
                    ageMaxCount = ageCount[key]
                }
            })
            console.log("test jdfdf", ageMax, ageMaxCount);



            if (keySearch) {
                const list = await itemModel.find({
                    "name": { "$regex": keySearch, "$options": "i" }
                })
                    .populate("category");
                const similarity = (a, b) => {
                    let common = 0;
                    const minLength = Math.min(a.length, b.length);
                    for (let i = 0; i < minLength; i++) {
                        if (a[i] === b[i]) common++;
                    }
                    return common / Math.max(a.length, b.length);
                };
                console.log(list);

                res.json(list.sort((a, b) => similarity(b?.age || "", ageMax) - similarity(a?.age || "", ageMax)));
            }
            else {
                const list = await itemModel.find({})
                    .populate("category");
                const similarity = (a, b) => {
                    let common = 0;
                    const minLength = Math.min(a.length, b.length);
                    for (let i = 0; i < minLength; i++) {
                        if (a[i] === b[i]) common++;
                    }
                    return common / Math.max(a.length, b.length);
                };
                console.log(list);

                res.json(list.sort((a, b) => similarity(b?.age || "", ageMax) - similarity(a?.age || "", ageMax)));
                res.json(list);
            }
        }
        catch (err) {
            console.log(err)
            res.status(404).json('not found');
        }
    }
    async post(req, res) {
        try {
            const shell = `python3 predict_age.py --kich_thuoc=${req.body.size?.[0].name} --chieu_dai=${req.body.length} --chu_vi=${req.body.perimeter} --mau_sac="${req.body.color}" --chat_lieu="${req.body.material}" --kieu_dang="${req.body.style}" --hoa_tiet="${req.body.texture}" --phu_kien="${req.body.accessory}" --do_day="${req.body.thickness}" --tinh_nang_dac_biet="${req.body.nature}"`

            const { stdout, stderr } = await execPromise(shell);
            console.log("info age", stdout);

            // Nếu có lỗi trong stderr, trả về lỗi
            if (stderr) {
                return res.status(500).json({ error: `stderr: ${stderr}` });
            }

            const category = await categoryModel.findOne({
                name: req.body.category
            })
            if (category) {
                const item = await itemModel.create({
                    name: req.body.name,
                    image: req.body.image,
                    describes: req.body.describes,
                    sale: req.body.sale,
                    size: req.body.size,
                    price: req.body.price,
                    category: category._id,
                    age: stdout.trim()
                })
                console.log(item);
                res.json({
                    name: req.body.name,
                    image: req.body.image,
                    describes: req.body.describes,
                    sale: req.body.sale,
                    size: req.body.size,
                    price: req.body.price,
                    category: {
                        _id: category._id,
                        name: category.name
                    },
                    age: stdout.trim()
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: "Category is not exsit!"
                })
            }
        }
        catch (err) {
            console.log(err);
            res.status(500).json('err');
        }
    }
    async getItemDetail(req, res) {
        try {
            console.log(req.params)
            const item = await itemModel.findById(req.params.id).populate("category");
            if (item) {
                res.json({
                    item
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: "Category is not exsit!"
                })
            }
        }
        catch (err) {
            res.status(500).json('err');
        }
    }
    async update(req, res) {
        try {
            const item = await itemModel.updateOne({ _id: req.params._id }, {
                name: req.body.name,
                image: req.body.image,
                describes: req.body.describes,
                sale: req.body.sale,
                size: req.body.size,
                price: req.body.price
            })
            res.json(req.body);
        }
        catch {
            res.status(500).json('error');
        }
    }
    async delete(req, res) {
        try {
            const respone = await itemModel.deleteOne({ _id: req.params._id });
            if (respone.deletedCount) {
                res.json('succes');
            }
            else {
                res.status(404).json('not found');
            }
        }
        catch (err) {
            res.status(500).json('error');
        }
    }
}
module.exports = new ItemController();