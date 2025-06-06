import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '@/api/axios'


const initialState={
    isLoading: false,
    productList: []
}

export const addNewProduct = createAsyncThunk('/products/addnewproduct', 
    async (formData)=>{
        const result = await api.post('/api/admin/products/add', formData, {
            headers: {
                'Content-Type' : 'application/json'
            }
        })

        return result?.data
    }

)

export const fetchAllProducts = createAsyncThunk('/products/fetchAllProducts', 
    async ()=>{
        const result = await api.get('/api/admin/products/get')
        return result?.data
    }

)

export const editProduct = createAsyncThunk('/products/editProduct', 
    async ({id, formData})=>{
        const result = await api.put(`/api/admin/products/edit/${id}`, formData, {
            headers: {
                'Content-Type' : 'application/json'
            }
        })

        return result?.data
    }

)

export const deleteProduct = createAsyncThunk('/products/deleteProduct', 
    async (id)=>{
        const result = await api.delete(`/api/admin/products/delete/${id}`)

        return result?.data
    }

)

const AdminProductsSlice = createSlice({
    name: 'adminProducts',
    initialState,
    reducers:{},
    extraReducers: (builder)=>{
        builder.addCase(fetchAllProducts.pending, (state)=>{
            state.isLoading = true
        }).addCase(fetchAllProducts.fulfilled, (state, action)=>{
            console.log(action.payload.data)
            state.isLoading = false
            state.productList = action.payload.data
        }).addCase(fetchAllProducts.rejected, (state, action)=>{
            console.log()
            state.isLoading = false
            state.productList = []
        })
    }
})

export default AdminProductsSlice.reducer