pragma specify 0.1

/* non-view functions are insert(key,value,lesser,greater), update(key,value,lesser,greater), remove(key) */
rule invariants_insert_basic(uint256 key, uint256 value, uint256 lesser, uint256 greater) {
	/* 
		The universe:
		< tail      lesser greaterOfLesser    key     lesserOfGreater  greater             head > 
	*/

	env ePre;
	/* Collect pre-data */
	uint256 _head = sinvoke getHead(ePre);
	uint256 _tail = sinvoke getTail(ePre);
	uint256 _numElements = sinvoke getNumElements(ePre);
	uint256 _greaterOfLesser = sinvoke getElementGreater(ePre, lesser);
	uint256 _lesserOfGreater = sinvoke getElementLesser(ePre, greater);
	
	/* pre-contains */
	bool _headContained = sinvoke contains(ePre,_head);
	bool _tailContained = sinvoke contains(ePre,_tail);
	bool _keyContained = sinvoke contains(ePre,key);
	bool _lesserContained = sinvoke contains(ePre,lesser);
	bool _greaterContained = sinvoke contains(ePre,greater);
	bool _greaterOfLesserContained = sinvoke contains(ePre,_greaterOfLesser);
	bool _lesserOfGreaterContained = sinvoke contains(ePre,_lesserOfGreater);
	
	/* list is empty iff num elements is 0 */
	require _head == 0 <=> _numElements == 0;
	/* head-tail symmetry */
	require _head == 0 <=> _tail == 0; 
	/* (exists key. contains(key)) => head != 0 && contains(head) && tail != 0 && contains(tail) */
	require ((_head != 0 && _headContained) 
			|| (_tail != 0 && _tailContained) 
			|| (lesser != 0 && _lesserContained) 
			|| (greater != 0 && _greaterContained)
			|| (key != 0 && _keyContained)
					) => (_head != 0 && _headContained && _tail != 0 && _tailContained);
	/* !contains(0) */
	require !sinvoke contains(ePre,0);
	
// TODO: I'm getting into an instantiation loop here... will all the greater, lesser pointers
	// /* forall key. contains(key) => (greater(key) != 0 => contains(greater(key))) && (lesser(key) != 0 => contains(lesser(key))) */ // TODO: Add this
	/* forall key. contains(key) => (greater(key) == 0 <=> key == head) && (lesser(key) == 0 <=> key == tail) */
	/* incomplete instantiation */
	if (_headContained) {
		uint256 _headGreater = sinvoke getElementGreater(ePre,_head);
		require (_headGreater == 0 <=> _head == _head) && (_headGreater != 0 => sinvoke contains(ePre,_headGreater));
		uint256 _headLesser = sinvoke getElementLesser(ePre,_head);
		require (_headLesser == 0 <=> _head == _tail) && (_headLesser != 0 => sinvoke contains(ePre,_headLesser));
	}
	if (_tailContained) {
		uint256 _tailGreater = sinvoke getElementGreater(ePre,_tail);
		require (_tailGreater == 0 <=> _tail == _head) && (_tailGreater != 0 => sinvoke contains(ePre,_tailGreater));
		uint256 _tailLesser = sinvoke getElementLesser(ePre,_tail);
		require (_tailLesser == 0 <=> _tail == _tail) && (_tailLesser != 0 => sinvoke contains(ePre,_tailLesser));
	}
	if (_keyContained) {
		uint256 _keyGreater = sinvoke getElementGreater(ePre,key);
		require(_keyGreater == 0 <=> key == _head) && (_keyGreater != 0 => sinvoke contains(ePre,_keyGreater));
		uint256 _keyLesser = sinvoke getElementLesser(ePre,key);
		require (_keyLesser == 0 <=> key == _tail) && (_keyLesser != 0 => sinvoke contains(ePre,_keyLesser));
	}
	if (_lesserContained) {
		require (_greaterOfLesser == 0 <=> lesser == _head) && (_greaterOfLesser != 0 => _greaterOfLesserContained);
		require sinvoke getElementLesser(ePre,lesser) == 0 <=> lesser == _tail;
	}
	if (_greaterContained) {
		require sinvoke getElementGreater(ePre,greater) == 0 <=> greater == _head;
		require (_lesserOfGreater == 0 <=> greater == _tail) && (_lesserOfGreater != 0 => _lesserOfGreaterContained);
	}
			
	env e;
	sinvoke insert(e,key,value,lesser,greater);

	env ePost;
	/* collect post-data */
	uint256 head_ = sinvoke getHead(ePost);
	uint256 tail_ = sinvoke getTail(ePost);
	uint256 numElements_ = sinvoke getNumElements(ePost);
	uint256 greaterOfLesser_ = sinvoke getElementGreater(ePost, lesser);
	uint256 lesserOfGreater_ = sinvoke getElementLesser(ePost, greater);
	
	/* post-contains */
	bool headContained_ = sinvoke contains(ePost,head_);
	bool tailContained_ = sinvoke contains(ePost,tail_);
	bool keyContained_ = sinvoke contains(ePost,key);
	bool lesserContained_ = sinvoke contains(ePost,lesser);
	bool greaterContained_ = sinvoke contains(ePost,greater);
	bool greaterOfLesserContained_ = sinvoke contains(ePost,greaterOfLesser_);
	bool lesserOfGreaterContained_ = sinvoke contains(ePost,lesserOfGreater_);
	
	// assert invariants hold
	assert head_ == 0 <=> numElements_ == 0, "Violated: list is empty iff num elements is 0";
	assert head_ == 0 <=> tail_ == 0, "Violated: head-tail symmetry";
	assert ((head_ != 0 && headContained_) 
			|| (tail_ != 0 && tailContained_) 
			|| (lesser != 0 && lesserContained_) 
			|| (greater != 0 && greaterContained_)
			|| (key != 0 && keyContained_)
					) => (head_ != 0 && headContained_ && tail_ != 0 && tailContained_), "head,tail are zero even though there are elements in the list";
	assert !sinvoke contains(ePost,0), "Key 0 cannot be in the list";
		
	// assert that new element is sorted properly
	uint256 actualNewValue = sinvoke getValue(ePost,key);
	assert actualNewValue == value, "New key $key value should be $value, got ${actualNewValue}";
	
	uint256 nextOfNewKey = sinvoke getElementGreater(ePost,key);
	uint256 prevOfNewKey = sinvoke getElementLesser(ePost,key);

	assert nextOfNewKey == 0 || sinvoke contains(ePost,nextOfNewKey), "New key $key next $nextOfNewKey should be contained in the list";
	assert prevOfNewKey == 0 || sinvoke contains(ePost,prevOfNewKey), "New key $key previous $prevOfNewKey should be contained in the list";
}

rule invariants_insert_basic_sorted(uint256 key, uint256 value, uint256 lesser, uint256 greater) {
	/* 
		The universe:
		< tail      lesser greaterOfLesser    key     lesserOfGreater  greater             head > 
		+ some i
	*/
	uint256 i; // random i for checking forall key. contains(key) => (greater(key) == 0 <=> key == head) && (lesser(key) == 0 <=> key == tail)
	uint256 j; // random j for checking sortedness together with i. 
	
	env ePre;
	/* Collect pre-data */
	uint256 _head = sinvoke getHead(ePre);
	uint256 _tail = sinvoke getTail(ePre);
	uint256 _numElements = sinvoke getNumElements(ePre);
	uint256 _greaterOfLesser = sinvoke getElementGreater(ePre, lesser);
	uint256 _lesserOfGreater = sinvoke getElementLesser(ePre, greater);
	
	/* pre-contains */
	bool _headContained = sinvoke contains(ePre,_head);
	bool _tailContained = sinvoke contains(ePre,_tail);
	bool _keyContained = sinvoke contains(ePre,key);
	bool _lesserContained = sinvoke contains(ePre,lesser);
	bool _greaterContained = sinvoke contains(ePre,greater);
	bool _greaterOfLesserContained = sinvoke contains(ePre,_greaterOfLesser);
	bool _lesserOfGreaterContained = sinvoke contains(ePre,_lesserOfGreater);
	bool _iContained = sinvoke contains(ePre,i);
	bool _jContained = sinvoke contains(ePre,j);
	
	/* pre-value */
	uint256 _headValue = sinvoke getValue(ePre,_head);
	uint256 _tailValue = sinvoke getValue(ePre,_tail);
	uint256 _keyValue = sinvoke getValue(ePre,key);
	uint256 _lesserValue = sinvoke getValue(ePre,lesser);
	uint256 _greaterValue = sinvoke getValue(ePre,greater);
	uint256 _greaterOfLesserValue = sinvoke getValue(ePre,_greaterOfLesser);
	uint256 _lesserOfGreaterValue = sinvoke getValue(ePre,_lesserOfGreater);
	uint256 _iValue = sinvoke getValue(ePre,i);
	uint256 _jValue = sinvoke getValue(ePre,j);
	
	/* list is empty iff num elements is 0 */
	require _head == 0 <=> _numElements == 0;
	/* head-tail symmetry */
	require _head == 0 <=> _tail == 0; 
	/* (exists key. contains(key)) => head != 0 && contains(head) && tail != 0 && contains(tail) */
	require ((_head != 0 && _headContained) 
			|| (_tail != 0 && _tailContained) 
			|| (lesser != 0 && _lesserContained) 
			|| (greater != 0 && _greaterContained)
			|| (key != 0 && _keyContained)
			|| (i != 0 && _iContained)
			|| (j != 0 && _jContained)
					) => (_head != 0 && _headContained && _tail != 0 && _tailContained);
	/* !contains(0) */
	require !sinvoke contains(ePre,0);
	
// TODO: I'm getting into an instantiation loop here... will all the greater, lesser pointers
	// /* forall key. contains(key) => (greater(key) != 0 => contains(greater(key))) && (lesser(key) != 0 => contains(lesser(key))) */
	/* forall key. contains(key) => (greater(key) == 0 <=> key == head) && (lesser(key) == 0 <=> key == tail) */
	/* forall key. contains(key) => getValue(tail) <= getValue(key) <= getValue(head) */
	/* incomplete instantiation */
	if (_headContained) {
		uint256 _headGreater = sinvoke getElementGreater(ePre,_head);
		require (_headGreater == 0 <=> _head == _head) && (_headGreater != 0 => sinvoke contains(ePre,_headGreater));
		uint256 _headLesser = sinvoke getElementLesser(ePre,_head);
		require (_headLesser == 0 <=> _head == _tail) && (_headLesser != 0 => sinvoke contains(ePre,_headLesser));
		require _tailValue <= _headValue && _headValue <= _headValue;		
	}
	if (_tailContained) {
		uint256 _tailGreater = sinvoke getElementGreater(ePre,_tail);
		require (_tailGreater == 0 <=> _tail == _head) && (_tailGreater != 0 => sinvoke contains(ePre,_tailGreater));
		uint256 _tailLesser = sinvoke getElementLesser(ePre,_tail);
		require (_tailLesser == 0 <=> _tail == _tail) && (_tailLesser != 0 => sinvoke contains(ePre,_tailLesser));
		require _tailValue <= _tailValue && _tailValue <= _headValue;		
	}
	if (_keyContained) {
		uint256 _keyGreater = sinvoke getElementGreater(ePre,key);
		require(_keyGreater == 0 <=> key == _head) && (_keyGreater != 0 => sinvoke contains(ePre,_keyGreater));
		uint256 _keyLesser = sinvoke getElementLesser(ePre,key);
		require (_keyLesser == 0 <=> key == _tail) && (_keyLesser != 0 => sinvoke contains(ePre,_keyLesser));
		require _tailValue <= _keyValue && _keyValue <= _headValue;		
	}
	if (_lesserContained) {
		require (_greaterOfLesser == 0 <=> lesser == _head) && (_greaterOfLesser != 0 => _greaterOfLesserContained);
		require sinvoke getElementLesser(ePre,lesser) == 0 <=> lesser == _tail;
		require _tailValue <= _lesserValue && _lesserValue <= _headValue;
	}
	if (_greaterContained) {
		require sinvoke getElementGreater(ePre,greater) == 0 <=> greater == _head;
		require (_lesserOfGreater == 0 <=> greater == _tail) && (_lesserOfGreater != 0 => _lesserOfGreaterContained);
		require _tailValue <= _greaterValue && _greaterValue <= _headValue;
	}
	if (_iContained) {
		require sinvoke getElementGreater(ePre,i) == 0 <=> i == _head;
		require sinvoke getElementLesser(ePre,i) == 0 <=> i == _tail;
		require _tailValue <= _iValue && _iValue <= _headValue;
	}
	if (_jContained) {
		require sinvoke getElementGreater(ePre,j) == 0 <=> j == _head;
		require sinvoke getElementLesser(ePre,j) == 0 <=> j == _tail;
		require _tailValue <= _jValue && _jValue <= _headValue;
	}
	/* more sortedness assumptions */
	// TODO: Move each to one where lesserValue and greaterValue are actually defined
	require _tailValue <= _lesserOfGreaterValue && _lesserOfGreaterValue <= _greaterValue
			&& _lesserValue <= _greaterOfLesserValue && _greaterOfLesserValue <= _headValue;
	
		
	env e;
	sinvoke insert(e,key,value,lesser,greater);

	env ePost;
	/* collect post-data */
	uint256 head_ = sinvoke getHead(ePost);
	uint256 tail_ = sinvoke getTail(ePost);
	uint256 numElements_ = sinvoke getNumElements(ePost);
	uint256 greaterOfLesser_ = sinvoke getElementGreater(ePost, lesser);
	uint256 lesserOfGreater_ = sinvoke getElementLesser(ePost, greater);
	
	/* post-contains */
	bool headContained_ = sinvoke contains(ePost,head_);
	bool tailContained_ = sinvoke contains(ePost,tail_);
	bool keyContained_ = sinvoke contains(ePost,key);
	bool lesserContained_ = sinvoke contains(ePost,lesser);
	bool greaterContained_ = sinvoke contains(ePost,greater);
	bool greaterOfLesserContained_ = sinvoke contains(ePost,greaterOfLesser_);
	bool lesserOfGreaterContained_ = sinvoke contains(ePost,lesserOfGreater_);
	bool iContained_ = sinvoke contains(ePost, i);
	bool jContained_ = sinvoke contains(ePost, j);
	
	/* post-value */
	uint256 headValue_ = sinvoke getValue(ePost,head_);
	uint256 tailValue_ = sinvoke getValue(ePost,tail_);
	uint256 keyValue_ = sinvoke getValue(ePost,key);
	uint256 lesserValue_ = sinvoke getValue(ePost,lesser);
	uint256 greaterValue_ = sinvoke getValue(ePost,greater);
	uint256 greaterOfLesserValue_ = sinvoke getValue(ePost,greaterOfLesser_);
	uint256 lesserOfGreaterValue_ = sinvoke getValue(ePost,lesserOfGreater_);
	uint256 iValue_ = sinvoke getValue(ePost, i);
	uint256 jValue_ = sinvoke getValue(ePost, j);
	
	// TODO: Remove invariants assertions that were previously checked
	// assert invariants hold
	assert head_ == 0 <=> numElements_ == 0, "Violated: list is empty iff num elements is 0";
	assert head_ == 0 <=> tail_ == 0, "Violated: head-tail symmetry";
	assert ((head_ != 0 && headContained_) 
			|| (tail_ != 0 && tailContained_) 
			|| (lesser != 0 && lesserContained_) 
			|| (greater != 0 && greaterContained_)
			|| (key != 0 && keyContained_)
			|| (i != 0 && iContained_)
			|| (j != 0 && jContained_)
					) => (head_ != 0 && headContained_ && tail_ != 0 && tailContained_), "head,tail are zero even though there are elements in the list";
	assert !sinvoke contains(ePost,0), "Key 0 cannot be in the list";
	
	if (iContained_) {
		assert sinvoke getElementGreater(ePost,i) == 0 <=> i == head_, "greater=0 implies element is head";
		assert sinvoke getElementLesser(ePost,i) == 0 <=> i == tail_, "lesser=0 implies element is tail";
		assert tailValue_ <= iValue_ && iValue_ <= headValue_, "violated min-max sortedness";
	}
	
	if (_iContained && _jContained && iContained_ && jContained_) {
		assert _iValue == iValue_, "i=$i that was already contained should not change its value";
		assert _jValue == jValue_, "j=$j that was already contained should not change its value";
		assert iValue_ <= jValue_ <=> _iValue <= _jValue, "Two elements that existed in the map must maintain their order"; // subsumed by the above
	}	
	
	// assert that new element is sorted properly
	uint256 actualNewValue = sinvoke getValue(ePost,key);
	assert actualNewValue == value, "New key $key value should be $value, got ${actualNewValue}";
	
	uint256 nextOfNewKey = sinvoke getElementGreater(ePost,key);
	uint256 nextOfNewKeyValue = sinvoke getValue(ePost,nextOfNewKey);
	uint256 prevOfNewKey = sinvoke getElementLesser(ePost,key);
	uint256 prevOfNewKeyValue = sinvoke getValue(ePost,prevOfNewKey);

	assert nextOfNewKey == 0 || sinvoke contains(ePost,nextOfNewKey), "New key $key next $nextOfNewKey should be contained in the list";
	assert prevOfNewKey == 0 || sinvoke contains(ePost,prevOfNewKey), "New key $key previous $prevOfNewKey should be contained in the list";
	assert nextOfNewKey == 0 || nextOfNewKeyValue >= value, "New key $key next $nextOfNewKey value $nextOfNewKeyValue should be greater or equal to $value";
	assert prevOfNewKey == 0 || prevOfNewKeyValue <= value, "New key $key previous $prevOfNewKey value $prevOfNewKeyValue value should be lesser or equal to $value";
}


rule max_correctness_insert(uint256 key, uint256 value, uint256 lesser, uint256 greater, uint256 i)
{
	env ePre; 
	env ePost;
	env eF;

	/* Collect pre-data */
	uint256 _head = sinvoke getHead(ePre);
	uint256 _tail = sinvoke getTail(ePre);
	uint256 _numElements = sinvoke getNumElements(ePre);
	uint256 _greaterOfLesser = sinvoke getElementGreater(ePre, lesser);
	uint256 _lesserOfGreater = sinvoke getElementLesser(ePre, greater);
	
	/* pre-contains */
	bool _headContained = sinvoke contains(ePre,_head);
	bool _tailContained = sinvoke contains(ePre,_tail);
	bool _keyContained = sinvoke contains(ePre,key);
	bool _lesserContained = sinvoke contains(ePre,lesser);
	bool _greaterContained = sinvoke contains(ePre,greater);
	bool _greaterOfLesserContained = sinvoke contains(ePre,_greaterOfLesser);
	bool _lesserOfGreaterContained = sinvoke contains(ePre,_lesserOfGreater);
	bool _iContained = sinvoke contains(ePre,i);
	
	/* pre-value */
	uint256 _headValue = sinvoke getValue(ePre,_head);
	uint256 _tailValue = sinvoke getValue(ePre,_tail);
	uint256 _keyValue = sinvoke getValue(ePre,key);
	uint256 _lesserValue = sinvoke getValue(ePre,lesser);
	uint256 _greaterValue = sinvoke getValue(ePre,greater);
	uint256 _greaterOfLesserValue = sinvoke getValue(ePre,_greaterOfLesser);
	uint256 _lesserOfGreaterValue = sinvoke getValue(ePre,_lesserOfGreater);
	uint256 _iValue = sinvoke getValue(ePre,i);
	
	/* list is empty iff num elements is 0 */
	require _head == 0 <=> _numElements == 0;
	/* head-tail symmetry */
	require _head == 0 <=> _tail == 0; 
	/* (exists key. contains(key)) => head != 0 && contains(head) && tail != 0 && contains(tail) */
	require ((_head != 0 && _headContained) 
			|| (_tail != 0 && _tailContained) 
			|| (lesser != 0 && _lesserContained) 
			|| (greater != 0 && _greaterContained)
			|| (key != 0 && _keyContained)
			|| (i != 0 && _iContained)
					) => (_head != 0 && _headContained && _tail != 0 && _tailContained);
	/* !contains(0) */
	require !sinvoke contains(ePre,0);

	/* forall key. contains(key) => (greater(key) == 0 <=> key == head) && (lesser(key) == 0 <=> key == tail) */
	/* forall key. contains(key) => getValues(tail) <= getValue(key) <= getValue(head) */
	/* incomplete instantiation */
	if (_headContained) {
		uint256 _headGreater = sinvoke getElementGreater(ePre,_head);
		require (_headGreater == 0 <=> _head == _head) && (_headGreater != 0 => sinvoke contains(ePre,_headGreater));
		uint256 _headLesser = sinvoke getElementLesser(ePre,_head);
		require (_headLesser == 0 <=> _head == _tail) && (_headLesser != 0 => sinvoke contains(ePre,_headLesser));
		require _tailValue <= _headValue && _headValue <= _headValue;		
	}
	if (_tailContained) {
		uint256 _tailGreater = sinvoke getElementGreater(ePre,_tail);
		require (_tailGreater == 0 <=> _tail == _head) && (_tailGreater != 0 => sinvoke contains(ePre,_tailGreater));
		uint256 _tailLesser = sinvoke getElementLesser(ePre,_tail);
		require (_tailLesser == 0 <=> _tail == _tail) && (_tailLesser != 0 => sinvoke contains(ePre,_tailLesser));
		require _tailValue <= _tailValue && _tailValue <= _headValue;		
	}
	if (_keyContained) {
		uint256 _keyGreater = sinvoke getElementGreater(ePre,key);
		require(_keyGreater == 0 <=> key == _head) && (_keyGreater != 0 => sinvoke contains(ePre,_keyGreater));
		uint256 _keyLesser = sinvoke getElementLesser(ePre,key);
		require (_keyLesser == 0 <=> key == _tail) && (_keyLesser != 0 => sinvoke contains(ePre,_keyLesser));
		require _tailValue <= _keyValue && _keyValue <= _headValue;		
	}
	if (_lesserContained) {
		require (_greaterOfLesser == 0 <=> lesser == _head) && (_greaterOfLesser != 0 => _greaterOfLesserContained);
		require sinvoke getElementLesser(ePre,lesser) == 0 <=> lesser == _tail;
		require _tailValue <= _lesserValue && _lesserValue <= _headValue;
	}
	if (_greaterContained) {
		require sinvoke getElementGreater(ePre,greater) == 0 <=> greater == _head;
		require (_lesserOfGreater == 0 <=> greater == _tail) && (_lesserOfGreater != 0 => _lesserOfGreaterContained);
		require _tailValue <= _greaterValue && _greaterValue <= _headValue;
	}
	if (_iContained) {
		require sinvoke getElementGreater(ePre,i) == 0 <=> i == _head;
		require sinvoke getElementLesser(ePre,i) == 0 <=> i == _tail;
		require _tailValue <= _iValue && _iValue <= _headValue;
	}
	
	/* more sortedness assumptions */
	require _tailValue <= _lesserOfGreaterValue && _lesserOfGreaterValue <= _greaterValue
			&& _lesserValue <= _greaterOfLesserValue && _greaterOfLesserValue <= _headValue;
	
			
	sinvoke insert(eF,key,value,lesser,greater);
	
	uint256 head_ = sinvoke getHead(ePost);
	assert head_ != 0, "List is empty after insert";
	uint256 headValue_ = sinvoke getValue(ePost,head_);
	uint256 iValue_ = sinvoke getValue(ePost,i);
	assert (i != 0 && sinvoke contains(ePost,i)) => iValue_ <= headValue_, "head is not maximal element";
}

rule min_correctness_insert(uint256 key, uint256 value, uint256 lesser, uint256 greater, uint256 i) 
{
	env ePre; 
	env ePost;
	env eF;

	/* Collect pre-data */
	uint256 _head = sinvoke getHead(ePre);
	uint256 _tail = sinvoke getTail(ePre);
	uint256 _numElements = sinvoke getNumElements(ePre);
	uint256 _greaterOfLesser = sinvoke getElementGreater(ePre, lesser);
	uint256 _lesserOfGreater = sinvoke getElementLesser(ePre, greater);
	
	/* pre-contains */
	bool _headContained = sinvoke contains(ePre,_head);
	bool _tailContained = sinvoke contains(ePre,_tail);
	bool _keyContained = sinvoke contains(ePre,key);
	bool _lesserContained = sinvoke contains(ePre,lesser);
	bool _greaterContained = sinvoke contains(ePre,greater);
	bool _greaterOfLesserContained = sinvoke contains(ePre,_greaterOfLesser);
	bool _lesserOfGreaterContained = sinvoke contains(ePre,_lesserOfGreater);
	bool _iContained = sinvoke contains(ePre,i);
	
	/* pre-value */
	uint256 _headValue = sinvoke getValue(ePre,_head);
	uint256 _tailValue = sinvoke getValue(ePre,_tail);
	uint256 _keyValue = sinvoke getValue(ePre,key);
	uint256 _lesserValue = sinvoke getValue(ePre,lesser);
	uint256 _greaterValue = sinvoke getValue(ePre,greater);
	uint256 _greaterOfLesserValue = sinvoke getValue(ePre,_greaterOfLesser);
	uint256 _lesserOfGreaterValue = sinvoke getValue(ePre,_lesserOfGreater);
	uint256 _iValue = sinvoke getValue(ePre,i);
	
	/* list is empty iff num elements is 0 */
	require _head == 0 <=> _numElements == 0;
	/* head-tail symmetry */
	require _head == 0 <=> _tail == 0; 
	/* (exists key. contains(key)) => head != 0 && contains(head) && tail != 0 && contains(tail) */
	require ((_head != 0 && _headContained) 
			|| (_tail != 0 && _tailContained) 
			|| (lesser != 0 && _lesserContained) 
			|| (greater != 0 && _greaterContained)
			|| (key != 0 && _keyContained)
			|| (i != 0 && _iContained)
					) => (_head != 0 && _headContained && _tail != 0 && _tailContained);
	/* !contains(0) */
	require !sinvoke contains(ePre,0);

	/* forall key. contains(key) => (greater(key) == 0 <=> key == head) && (lesser(key) == 0 <=> key == tail) */
	/* forall key. contains(key) => getValues(tail) <= getValue(key) <= getValue(head) */
	/* incomplete instantiation */
	if (_headContained) {
		uint256 _headGreater = sinvoke getElementGreater(ePre,_head);
		require (_headGreater == 0 <=> _head == _head) && (_headGreater != 0 => sinvoke contains(ePre,_headGreater));
		uint256 _headLesser = sinvoke getElementLesser(ePre,_head);
		require (_headLesser == 0 <=> _head == _tail) && (_headLesser != 0 => sinvoke contains(ePre,_headLesser));
		require _tailValue <= _headValue && _headValue <= _headValue;		
	}
	if (_tailContained) {
		uint256 _tailGreater = sinvoke getElementGreater(ePre,_tail);
		require (_tailGreater == 0 <=> _tail == _head) && (_tailGreater != 0 => sinvoke contains(ePre,_tailGreater));
		uint256 _tailLesser = sinvoke getElementLesser(ePre,_tail);
		require (_tailLesser == 0 <=> _tail == _tail) && (_tailLesser != 0 => sinvoke contains(ePre,_tailLesser));
		require _tailValue <= _tailValue && _tailValue <= _headValue;		
	}
	if (_keyContained) {
		uint256 _keyGreater = sinvoke getElementGreater(ePre,key);
		require(_keyGreater == 0 <=> key == _head) && (_keyGreater != 0 => sinvoke contains(ePre,_keyGreater));
		uint256 _keyLesser = sinvoke getElementLesser(ePre,key);
		require (_keyLesser == 0 <=> key == _tail) && (_keyLesser != 0 => sinvoke contains(ePre,_keyLesser));
		require _tailValue <= _keyValue && _keyValue <= _headValue;		
	}
	if (_lesserContained) {
		require (_greaterOfLesser == 0 <=> lesser == _head) && (_greaterOfLesser != 0 => _greaterOfLesserContained);
		require sinvoke getElementLesser(ePre,lesser) == 0 <=> lesser == _tail;
		require _tailValue <= _lesserValue && _lesserValue <= _headValue;
	}
	if (_greaterContained) {
		require sinvoke getElementGreater(ePre,greater) == 0 <=> greater == _head;
		require (_lesserOfGreater == 0 <=> greater == _tail) && (_lesserOfGreater != 0 => _lesserOfGreaterContained);
		require _tailValue <= _greaterValue && _greaterValue <= _headValue;
	}
	if (_iContained) {
		require sinvoke getElementGreater(ePre,i) == 0 <=> i == _head;
		require sinvoke getElementLesser(ePre,i) == 0 <=> i == _tail;
		require _tailValue <= _iValue && _iValue <= _headValue;
	}
	
	/* more sortedness assumptions */
	require _tailValue <= _lesserOfGreaterValue && _lesserOfGreaterValue <= _greaterValue
			&& _lesserValue <= _greaterOfLesserValue && _greaterOfLesserValue <= _headValue;
	
			
	sinvoke insert(eF,key,value,lesser,greater);
	
	uint256 tail_ = sinvoke getTail(ePost);
	assert tail_ != 0, "List is empty after insert";
	uint256 tailValue_ = sinvoke getValue(ePost,tail_);
	uint256 iValue_ = sinvoke getValue(ePost,i);
	assert (i != 0 && sinvoke contains(ePost,i)) => iValue_ >= tailValue_, "tail is not minimal element";

}


rule insert_succeeds_only_if_preconds_hold(uint256 key, uint256 value, uint256 lesser, uint256 greater)
{

	env ePre; havoc ePre;
	env ePost; havoc ePost;
	env eF; havoc eF;
	
	/* Collect pre-data */
	uint256 _head = sinvoke getHead(ePre);
	uint256 _tail = sinvoke getTail(ePre);
	uint256 _numElements = sinvoke getNumElements(ePre);
	uint256 _greaterOfLesser = sinvoke getElementGreater(ePre, lesser);
	uint256 _lesserOfGreater = sinvoke getElementLesser(ePre, greater);
	
	/* pre-contains */
	bool _headContained = sinvoke contains(ePre,_head);
	bool _tailContained = sinvoke contains(ePre,_tail);
	bool _keyContained = sinvoke contains(ePre,key);
	bool _lesserContained = sinvoke contains(ePre,lesser);
	bool _greaterContained = sinvoke contains(ePre,greater);
	bool _greaterOfLesserContained = sinvoke contains(ePre,_greaterOfLesser);
	bool _lesserOfGreaterContained = sinvoke contains(ePre,_lesserOfGreater);
		
	/* pre-value */
	uint256 _headValue = sinvoke getValue(ePre,_head);
	uint256 _tailValue = sinvoke getValue(ePre,_tail);
	uint256 _keyValue = sinvoke getValue(ePre,key);
	uint256 _lesserValue = sinvoke getValue(ePre,lesser);
	uint256 _greaterValue = sinvoke getValue(ePre,greater);
	uint256 _greaterOfLesserValue = sinvoke getValue(ePre,_greaterOfLesser);
	uint256 _lesserOfGreaterValue = sinvoke getValue(ePre,_lesserOfGreater);
	
	bool precond = key != 0
				&& key != lesser && key != greater && !(sinvoke contains(ePre,key))
				&& _numElements < 115792089237316195423570985008687907853269984665640564039457584007913129639935 /* MAX-1 */
				&& (lesser != 0 || greater != 0 || _numElements == 0)
				&& (lesser == 0 || _lesserContained)
				&& (greater == 0 || _greaterContained)
				&& eF.msg.value == 0; // non payable

	bool lesserCorrect;
	if (lesser != 0) {
		lesserCorrect = _lesserContained;
		if (_lesserContained) {
			lesserCorrect = lesserCorrect && _lesserValue <= value;
			if (_greaterOfLesser != 0) {
				lesserCorrect = lesserCorrect && _greaterOfLesserContained && (value <= _greaterOfLesserValue);
			}
		}
	} else {
		lesserCorrect = _tail == 0 || value <= _tailValue;
	}

	bool greaterCorrect;
	if (greater != 0) {
		greaterCorrect = _greaterContained;
		if (greaterCorrect) {
			greaterCorrect = greaterCorrect && value <= _greaterValue;
			if (_lesserOfGreater != 0) {
				greaterCorrect = greaterCorrect && _lesserOfGreaterContained && (_lesserOfGreaterValue <= value);
			}
		}
	} else {
		greaterCorrect = _head == 0 || _headValue <= value;
	}

	precond = precond && (lesserCorrect || greaterCorrect);

	// now assume invariants
	/* list is empty iff num elements is 0 */
	require _head == 0 <=> _numElements == 0;
	/* head-tail symmetry */
	require _head == 0 <=> _tail == 0; 
	/* (exists key. contains(key)) => head != 0 && contains(head) && tail != 0 && contains(tail) */
	require ((_head != 0 && _headContained) 
			|| (_tail != 0 && _tailContained) 
			|| (lesser != 0 && _lesserContained) 
			|| (greater != 0 && _greaterContained)
			|| (key != 0 && _keyContained)
					) => (_head != 0 && _headContained && _tail != 0 && _tailContained);
	/* !contains(0) */
	require !sinvoke contains(ePre,0);

	/* forall key. contains(key) => (greater(key) == 0 <=> key == head) && (lesser(key) == 0 <=> key == tail) */
	/* forall key. contains(key) => getValues(tail) <= getValue(key) <= getValue(head) */
	/* incomplete instantiation */
	if (_headContained) {
		uint256 _headGreater = sinvoke getElementGreater(ePre,_head);
		require (_headGreater == 0 <=> _head == _head) && (_headGreater != 0 => sinvoke contains(ePre,_headGreater));
		uint256 _headLesser = sinvoke getElementLesser(ePre,_head);
		require (_headLesser == 0 <=> _head == _tail) && (_headLesser != 0 => sinvoke contains(ePre,_headLesser));
		require _tailValue <= _headValue && _headValue <= _headValue;		
	}
	if (_tailContained) {
		uint256 _tailGreater = sinvoke getElementGreater(ePre,_tail);
		require (_tailGreater == 0 <=> _tail == _head) && (_tailGreater != 0 => sinvoke contains(ePre,_tailGreater));
		uint256 _tailLesser = sinvoke getElementLesser(ePre,_tail);
		require (_tailLesser == 0 <=> _tail == _tail) && (_tailLesser != 0 => sinvoke contains(ePre,_tailLesser));
		require _tailValue <= _tailValue && _tailValue <= _headValue;		
	}
	if (_keyContained) {
		uint256 _keyGreater = sinvoke getElementGreater(ePre,key);
		require(_keyGreater == 0 <=> key == _head) && (_keyGreater != 0 => sinvoke contains(ePre,_keyGreater));
		uint256 _keyLesser = sinvoke getElementLesser(ePre,key);
		require (_keyLesser == 0 <=> key == _tail) && (_keyLesser != 0 => sinvoke contains(ePre,_keyLesser));
		require _tailValue <= _keyValue && _keyValue <= _headValue;		
	}
	if (_lesserContained) {
		require (_greaterOfLesser == 0 <=> lesser == _head) && (_greaterOfLesser != 0 => _greaterOfLesserContained);
		require sinvoke getElementLesser(ePre,lesser) == 0 <=> lesser == _tail;
		require _tailValue <= _lesserValue && _lesserValue <= _headValue;
	}
	if (_greaterContained) {
		require sinvoke getElementGreater(ePre,greater) == 0 <=> greater == _head;
		require (_lesserOfGreater == 0 <=> greater == _tail) && (_lesserOfGreater != 0 => _lesserOfGreaterContained);
		require _tailValue <= _greaterValue && _greaterValue <= _headValue;
	}
		
	/* more sortedness assumptions */
	require _tailValue <= _lesserOfGreaterValue && _lesserOfGreaterValue <= _greaterValue
			&& _lesserValue <= _greaterOfLesserValue && _greaterOfLesserValue <= _headValue;

	invoke insert(eF, key, value, lesser, greater);
	bool insertSucceeded = !lastReverted;
	
	assert insertSucceeded => precond, "Insert succeeded but one of the preconditions did not hold";
}

rule insert_preconditions_check(uint256 key, uint256 value, uint256 lesser, uint256 greater)
{
	env ePre; havoc ePre;
	env ePost; havoc ePost;
	env eF; havoc eF;
	
	/* Collect pre-data */
	uint256 _head = sinvoke getHead(ePre);
	uint256 _tail = sinvoke getTail(ePre);
	uint256 _numElements = sinvoke getNumElements(ePre);
	uint256 _greaterOfLesser = sinvoke getElementGreater(ePre, lesser);
	uint256 _lesserOfGreater = sinvoke getElementLesser(ePre, greater);
	
	/* pre-contains */
	bool _headContained = sinvoke contains(ePre,_head);
	bool _tailContained = sinvoke contains(ePre,_tail);
	bool _keyContained = sinvoke contains(ePre,key);
	bool _lesserContained = sinvoke contains(ePre,lesser);
	bool _greaterContained = sinvoke contains(ePre,greater);
	bool _greaterOfLesserContained = sinvoke contains(ePre,_greaterOfLesser);
	bool _lesserOfGreaterContained = sinvoke contains(ePre,_lesserOfGreater);
		
	/* pre-value */
	uint256 _headValue = sinvoke getValue(ePre,_head);
	uint256 _tailValue = sinvoke getValue(ePre,_tail);
	uint256 _keyValue = sinvoke getValue(ePre,key);
	uint256 _lesserValue = sinvoke getValue(ePre,lesser);
	uint256 _greaterValue = sinvoke getValue(ePre,greater);
	uint256 _greaterOfLesserValue = sinvoke getValue(ePre,_greaterOfLesser);
	uint256 _lesserOfGreaterValue = sinvoke getValue(ePre,_lesserOfGreater);
	
	// Preconditions - TODO: Check that fails if any of these are not true
	require key != 0; 
	require key != lesser && key != greater && !(sinvoke contains(ePre,key));
	require _numElements < 115792089237316195423570985008687907853269984665640564039457584007913129639935 /* MAX-1 */;
	require lesser != 0 || greater != 0 || _numElements == 0;
	require lesser == 0 || _lesserContained;
	require greater == 0 || _greaterContained;
	require eF.msg.value == 0; // non payable

	bool lesserCorrect;
	if (lesser != 0) {
		lesserCorrect = _lesserContained;
		if (_lesserContained) {
			lesserCorrect = lesserCorrect && _lesserValue <= value;
			if (_greaterOfLesser != 0) {
				lesserCorrect = lesserCorrect && _greaterOfLesserContained && (value <= _greaterOfLesserValue);
			}
		}
	} else {
		lesserCorrect = _tail == 0 || value <= _tailValue;
	}

	bool greaterCorrect;
	if (greater != 0) {
		greaterCorrect = _greaterContained;
		if (greaterCorrect) {
			greaterCorrect = greaterCorrect && value <= _greaterValue;
			if (_lesserOfGreater != 0) {
				greaterCorrect = greaterCorrect && _lesserOfGreaterContained && (_lesserOfGreaterValue <= value);
			}
		}
	} else {
		greaterCorrect = _head == 0 || _headValue <= value;
	}

	require lesserCorrect || greaterCorrect;


	// Assume invariants
	
	/* list is empty iff num elements is 0 */
	require _head == 0 <=> _numElements == 0;
	/* head-tail symmetry */
	require _head == 0 <=> _tail == 0; 
	/* (exists key. contains(key)) => head != 0 && contains(head) && tail != 0 && contains(tail) */
	require ((_head != 0 && _headContained) 
			|| (_tail != 0 && _tailContained) 
			|| (lesser != 0 && _lesserContained) 
			|| (greater != 0 && _greaterContained)
			|| (key != 0 && _keyContained)
					) => (_head != 0 && _headContained && _tail != 0 && _tailContained);
	/* !contains(0) */
	require !sinvoke contains(ePre,0);

	/* forall key. contains(key) => (greater(key) == 0 <=> key == head) && (lesser(key) == 0 <=> key == tail) */
	/* forall key. contains(key) => getValues(tail) <= getValue(key) <= getValue(head) */
	// NEW forall key. contains(key) => contains(greater(key)) && contains(lesser(key))
	/* incomplete instantiation */
	if (_headContained) {
		uint256 _headGreater = sinvoke getElementGreater(ePre,_head);
		require (_headGreater == 0 <=> _head == _head) && (_headGreater != 0 => sinvoke contains(ePre,_headGreater));
		uint256 _headLesser = sinvoke getElementLesser(ePre,_head);
		require (_headLesser == 0 <=> _head == _tail) && (_headLesser != 0 => sinvoke contains(ePre,_headLesser));
		require _tailValue <= _headValue && _headValue <= _headValue;		
	}
	if (_tailContained) {
		uint256 _tailGreater = sinvoke getElementGreater(ePre,_tail);
		require (_tailGreater == 0 <=> _tail == _head) && (_tailGreater != 0 => sinvoke contains(ePre,_tailGreater));
		uint256 _tailLesser = sinvoke getElementLesser(ePre,_tail);
		require (_tailLesser == 0 <=> _tail == _tail) && (_tailLesser != 0 => sinvoke contains(ePre,_tailLesser));
		require _tailValue <= _tailValue && _tailValue <= _headValue;		
	}
	if (_keyContained) {
		uint256 _keyGreater = sinvoke getElementGreater(ePre,key);
		require(_keyGreater == 0 <=> key == _head) && (_keyGreater != 0 => sinvoke contains(ePre,_keyGreater));
		uint256 _keyLesser = sinvoke getElementLesser(ePre,key);
		require (_keyLesser == 0 <=> key == _tail) && (_keyLesser != 0 => sinvoke contains(ePre,_keyLesser));
		require _tailValue <= _keyValue && _keyValue <= _headValue;		
	}
	if (_lesserContained) {
		require (_greaterOfLesser == 0 <=> lesser == _head) && (_greaterOfLesser != 0 => _greaterOfLesserContained);
		require sinvoke getElementLesser(ePre,lesser) == 0 <=> lesser == _tail;
		require _tailValue <= _lesserValue && _lesserValue <= _headValue;
	}
	if (_greaterContained) {
		require sinvoke getElementGreater(ePre,greater) == 0 <=> greater == _head;
		require (_lesserOfGreater == 0 <=> greater == _tail) && (_lesserOfGreater != 0 => _lesserOfGreaterContained);
		require _tailValue <= _greaterValue && _greaterValue <= _headValue;
	}
	
	// greater of lesserOfGreater is greater, lesser of greaterOfLesser is lesser
	require sinvoke getElementGreater(ePre,_lesserOfGreater) == greater;
	require sinvoke getElementLesser(ePre,_greaterOfLesser) == lesser;
		
	/* more sortedness assumptions */
	require _tailValue <= _lesserOfGreaterValue && _lesserOfGreaterValue <= _greaterValue
			&& _lesserValue <= _greaterOfLesserValue && _greaterOfLesserValue <= _headValue;
		
	invoke insert(eF, key, value, lesser, greater);
	bool insertSucceeded = !lastReverted;
	
	assert insertSucceeded, "insert did not succeed";
	assert sinvoke contains(ePost,key), "new key $key must be contained";
	uint256 actualNewValue = sinvoke getValue(ePost,key);
	assert actualNewValue == value, "inserted a different value, expected $value but got $actualNewValue";
	
	// check - Add assertion about the previous and next of the new key-- new key's lesser's next is key, new key's greater's prev is key. 
	uint256 greaterOfNewKey = sinvoke getElementGreater(ePost,key);
	assert greaterOfNewKey != 0 => sinvoke getElementLesser(ePost,greaterOfNewKey) == key, "New key $key lesser of its greater must be the key";
	uint256 lesserOfNewKey = sinvoke getElementLesser(ePost,key);
	assert lesserOfNewKey != 0 => sinvoke getElementGreater(ePost,lesserOfNewKey) == key, "New key $key greater of its lesser must be the key";
}


rule sortedness_remove(uint256 i, uint256 j)
{
	env _e; 
	env e_;
	env eF; 
	
	// first make sure i,j are in the list
	require sinvoke contains(_e,i);
	require sinvoke contains(_e,j);
	
	uint256 valI = sinvoke getValue(_e,i);
	uint256 valJ = sinvoke getValue(_e,j);
	
	require valI <= valJ;
	
	uint256 arg1;
	require arg1 != i && arg1 != j; // not removing i or j
	invoke remove(eF, arg1);
	
	uint256 valI_ = sinvoke getValue(e_,i);
	uint256 valJ_ = sinvoke getValue(e_,j);
	
	assert sinvoke contains(e_,i), "i=$i removed from list";
	assert sinvoke contains(e_,j), "j=$j removed from list";
	assert valI_ <= valJ_, "Not sorted";
}

rule remove_nullifies_value_and_removes(uint256 key) {
	env _e;
	env eF;
	env e_;
	
	bool _containedKey = sinvoke contains(_e,key);
	require _containedKey; // We check the case where the removed key is not contained in another rule
	
	uint256 _numElements = sinvoke getNumElements(_e);
	require _numElements >= 1; // if key is contained, then num elements is at least 1
		
	uint256 _lesserKey = sinvoke getElementLesser(_e, key);
	uint256 _greaterKey = sinvoke getElementGreater(_e, key);
	
	require !sinvoke contains(_e,0); // invariant
	require _lesserKey == 0 || sinvoke contains(_e,_lesserKey); // invariant
	require _greaterKey == 0 || sinvoke contains(_e,_greaterKey); // invariant
	
	uint256 _greaterOfLesserKey = sinvoke getElementGreater(_e,_lesserKey);
	uint256 _lesserOfGreaterKey = sinvoke getElementLesser(_e,_greaterKey);
	require _greaterOfLesserKey == key && _lesserOfGreaterKey == key; // invariant
	
	// those should not change
	uint256 _lesserOfLesserKey = sinvoke getElementLesser(_e,_lesserKey);
	uint256 _greaterOfGreaterKey = sinvoke getElementGreater(_e,_greaterKey);
	
	require _lesserOfLesserKey != key && _greaterOfGreaterKey != key; // invariant: list is not cyclic, need to check
		
	sinvoke remove(eF, key);
	
	uint256 lesserOfLesserKey_ = sinvoke getElementLesser(e_,_lesserKey);
	uint256 greaterOfGreaterKey_ = sinvoke getElementGreater(e_,_greaterKey);
	
	assert !sinvoke contains(e_,key), "Key not removed";
	assert sinvoke getValue(e_,key) == 0, "Value of removed key not nullified";
	assert _lesserKey != 0 => sinvoke getElementGreater(e_,_lesserKey) == _greaterKey, "Lesser key of removed key should now point to greater as next";
	assert _greaterKey != 0 => sinvoke getElementLesser(e_,_greaterKey) == _lesserKey, "Greater key of removed key should now point to lesser as prev";
	assert _lesserKey != 0 => _lesserOfLesserKey == lesserOfLesserKey_, "Lesser key of lesser key has unexpectedly changed";
	assert _greaterKey != 0 => _greaterOfGreaterKey == greaterOfGreaterKey_, "Lesser key of lesser key has unexpectedly changed";
}

rule remove_preconditions(uint256 key) {
	env _e;
	env eF;
	env e_;
	
	bool _keyIn = sinvoke contains(_e,key);
	
	invoke remove(eF,key);
	bool removeSucceeded = !lastReverted;
	
	assert !_keyIn => !removeSucceeded, "Could not succeed in removing key if key did not exist before";
}


rule sortedness_update(uint256 i, uint256 j)
{
	env ePre; havoc ePre;
	env ePost; havoc ePost;
	env eF; havoc eF;
	
	// first make sure i,j are in the list
	require sinvoke contains(ePre,i);
	require sinvoke contains(ePre,j);
	
	uint256 valI = sinvoke getValue(ePre,i);
	uint256 valJ = sinvoke getValue(ePre,j);
	
	require valI <= valJ;
	
	uint256 arg1; uint256 arg2; uint256 arg3; uint256 arg4;
	require (arg1 != i && arg1 != j) || (valI <= arg2 && arg2 <= valJ); // new value does not break the order - either updating a different element, or new value still maintains original order
	invoke update(eF, arg1, arg2, arg3, arg4);
	
	uint256 valI_ = sinvoke getValue(ePost,i);
	uint256 valJ_ = sinvoke getValue(ePost,j);
	
	assert sinvoke contains(ePost,i), "i=$i removed from list";
	assert sinvoke contains(ePost,j), "j=$j removed from list";
	assert valI_ <= valJ_, "Not sorted";
}


rule contents_insert(uint256 i)
{
	env ePre; havoc ePre;
	env ePost; havoc ePost;
	env eF; havoc eF;

	bool _iContained = sinvoke contains(ePre, i);
	uint256 _iValue = sinvoke getValue(ePre, i);

	uint256 newKey; uint256 newValue; uint256 lesserKey; uint256 greaterKey;
	sinvoke insert(eF, newKey, newValue, lesserKey, greaterKey);

	bool iContained_ = sinvoke contains(ePost, i);
	uint256 iValue_ = sinvoke getValue(ePost, i);

	assert (iContained_ <=> _iContained) || i == newKey, "Violated: Any previous element $i in the list is still in the list, any element not previously in the list is not in the list (with the exception of new key $newKey)";
	assert i != newKey => _iValue == iValue_, "Violated: Any element $i except for new key $newKey should have exactly the same value returned by getValue";
	assert i == newKey => iValue_ == newValue, "Violated: New element $i has an unexpected value";
}


rule contents_remove(uint256 i)
{
	env ePre; havoc ePre;
	env ePost; havoc ePost;
	env eF; havoc eF;

	bool _iContained = sinvoke contains(ePre, i);
	uint256 _iValue = sinvoke getValue(ePre, i);

	uint256 removedKey;
	sinvoke remove(eF, removedKey);

	bool iContained_ = sinvoke contains(ePost, i);
	uint256 iValue_ = sinvoke getValue(ePost, i);

	assert iContained_ <=> _iContained && i != removedKey, "Violated: Any previous element $i in the list is still in the list, any element not previously in the list is not in the list (with the exception of removed key $removedKey)";
	assert i != removedKey => _iValue == iValue_, "Violated: Any element $i except for removed key $removedKey should have exactly the same value returned by getValue";
}

rule contents_update(uint256 i)
{
	env ePre; havoc ePre;
	env ePost; havoc ePost;
	env eF; havoc eF;

	bool _iContained = sinvoke contains(ePre, i);
	uint256 _iValue = sinvoke getValue(ePre, i);

	uint256 updatedKey; uint256 updatedValue; uint256 lesserKey; uint256 greaterKey;
	sinvoke update(eF, updatedKey, updatedValue, lesserKey, greaterKey);

	bool iContained_ = sinvoke contains(ePost, i);
	uint256 iValue_ = sinvoke getValue(ePost, i);

	assert iContained_ <=> _iContained, "Violated: Any previous element $i in the list is still in the list, any element not previously in the list is not in the list";
	assert i != updatedKey => _iValue == iValue_, "Violated: Any element $i except for the updated key $updatedKey has the same value";
	assert i == updatedKey => iValue_ == updatedValue, "Violated: Updated element $i has an unexpected value";

}

rule invariants_remove_basic_sorted(uint256 key) {
/* 
		The universe:
		< tail      lesser     key      greater             head > 
		+ some i
	*/
	uint256 i; // random i for checking forall key. contains(key) => (greater(key) == 0 <=> key == head) && (lesser(key) == 0 <=> key == tail)
	uint256 j; // random j for checking sortedness together with i. 
	
	env ePre;
	// key is contained for remove to succeed, so it hash lesser and greater
	uint256 lesser = sinvoke getElementLesser(ePre,key);
	uint256 greater = sinvoke getElementGreater(ePre,key);
	/* Collect pre-data */
	uint256 _head = sinvoke getHead(ePre);
	uint256 _tail = sinvoke getTail(ePre);
	uint256 _numElements = sinvoke getNumElements(ePre);
	
	/* pre-contains */
	bool _headContained = sinvoke contains(ePre,_head);
	bool _tailContained = sinvoke contains(ePre,_tail);
	bool _keyContained = sinvoke contains(ePre,key);
	bool _iContained = sinvoke contains(ePre,i);
	bool _jContained = sinvoke contains(ePre,j);
	bool _lesserContained = sinvoke contains(ePre,lesser);
	bool _greaterContained = sinvoke contains(ePre,greater);
	
	/* pre-value */
	uint256 _headValue = sinvoke getValue(ePre,_head);
	uint256 _tailValue = sinvoke getValue(ePre,_tail);
	uint256 _keyValue = sinvoke getValue(ePre,key);
	uint256 _iValue = sinvoke getValue(ePre,i);
	uint256 _jValue = sinvoke getValue(ePre,j);
	uint256 _lesserValue = sinvoke getValue(ePre,lesser);
	uint256 _greaterValue = sinvoke getValue(ePre,greater);
	
	// extra requirements
	/* if head == tail and non-zero, num elements is 1 (require only) */
	require (_head == _tail && _head != 0) => _numElements == 1;
	/* if num of elements is one, then i,j,key are necessarily head or not contains*/
	require (_numElements == 1) => ((i == _head || !_iContained)
										&& (j == _head || !_jContained)
										&& (key == _head || !_keyContained)
									);									
	/* no cycles */
	require lesser != key && greater != key;
	require lesser != key => lesser != _head;
	require greater != key => greater != _tail;
	/* if there are two distinct elements then list size is >= 2 */
	// check on universe i,j,key,head,tail,lesser,greater - but for easyness, just take the key and its lesser and greater - at least one additional must exist for size to be >= 2
	require (_lesserContained || _greaterContained) => _numElements >= 2;
	
	/* list is empty iff num elements is 0 */
	require _head == 0 <=> _numElements == 0;
	/* head-tail symmetry */
	require _head == 0 <=> _tail == 0; 
	/* (exists key. contains(key)) => head != 0 && contains(head) && tail != 0 && contains(tail) */
	require ((_head != 0 && _headContained) 
			|| (_tail != 0 && _tailContained) 
			|| (key != 0 && _keyContained)
			|| (i != 0 && _iContained)
			|| (j != 0 && _jContained)
					) => (_head != 0 && _headContained && _tail != 0 && _tailContained);
	/* !contains(0) */
	require !sinvoke contains(ePre,0);
	
// TODO: I'm getting into an instantiation loop here... will all the greater, lesser pointers
	// /* forall key. contains(key) => (greater(key) != 0 => contains(greater(key))) && (lesser(key) != 0 => contains(lesser(key))) */
	/* forall key. contains(key) => (greater(key) == 0 <=> key == head) && (lesser(key) == 0 <=> key == tail) */
	/* forall key. contains(key) => getValue(tail) <= getValue(key) <= getValue(head) */
	/* incomplete instantiation */
	if (_headContained) {
		uint256 _headGreater = sinvoke getElementGreater(ePre,_head);
		require (_headGreater == 0 <=> _head == _head) && (_headGreater != 0 => sinvoke contains(ePre,_headGreater));
		uint256 _headLesser = sinvoke getElementLesser(ePre,_head);
		require (_headLesser == 0 <=> _head == _tail) && (_headLesser != 0 => sinvoke contains(ePre,_headLesser));
		require _tailValue <= _headValue && _headValue <= _headValue;		
	}
	if (_tailContained) {
		uint256 _tailGreater = sinvoke getElementGreater(ePre,_tail);
		require (_tailGreater == 0 <=> _tail == _head) && (_tailGreater != 0 => sinvoke contains(ePre,_tailGreater));
		uint256 _tailLesser = sinvoke getElementLesser(ePre,_tail);
		require (_tailLesser == 0 <=> _tail == _tail) && (_tailLesser != 0 => sinvoke contains(ePre,_tailLesser));
		require _tailValue <= _tailValue && _tailValue <= _headValue;		
	}
	if (_keyContained) {
		uint256 _keyGreater = sinvoke getElementGreater(ePre,key);
		require(_keyGreater == 0 <=> key == _head) && (_keyGreater != 0 => sinvoke contains(ePre,_keyGreater));
		uint256 _keyLesser = sinvoke getElementLesser(ePre,key);
		require (_keyLesser == 0 <=> key == _tail) && (_keyLesser != 0 => sinvoke contains(ePre,_keyLesser));
		require _tailValue <= _keyValue && _keyValue <= _headValue;		
	}
	if (_iContained) {
		require sinvoke getElementGreater(ePre,i) == 0 <=> i == _head;
		require sinvoke getElementLesser(ePre,i) == 0 <=> i == _tail;
		require _tailValue <= _iValue && _iValue <= _headValue;
	}
	if (_jContained) {
		require sinvoke getElementGreater(ePre,j) == 0 <=> j == _head;
		require sinvoke getElementLesser(ePre,j) == 0 <=> j == _tail;
		require _tailValue <= _jValue && _jValue <= _headValue;
	}
	if (_lesserContained) {
		require (sinvoke getElementGreater(ePre,lesser) == 0 <=> lesser == _head); // && (_greaterOfLesser != 0 => _greaterOfLesserContained);
		require sinvoke getElementLesser(ePre,lesser) == 0 <=> lesser == _tail;
		require _tailValue <= _lesserValue && _lesserValue <= _headValue;
	}
	if (_greaterContained) {
		require sinvoke getElementGreater(ePre,greater) == 0 <=> greater == _head;
		require (sinvoke getElementLesser(ePre,greater) == 0 <=> greater == _tail);// && (_lesserOfGreater != 0 => _lesserOfGreaterContained);
		require _tailValue <= _greaterValue && _greaterValue <= _headValue;
	}
	/* more sortedness assumptions */
	require (lesser != 0 && _iValue > _lesserValue) => (_iValue > _keyValue || i == key || i == lesser);
	require (lesser != 0 && _jValue > _lesserValue) => (_jValue > _keyValue || j == key || j == lesser);
	require (greater != 0 && _iValue < _greaterValue) => (_iValue < _keyValue || i == key || i == greater);
	require (greater != 0 && _jValue < _greaterValue) => (_jValue < _keyValue || j == key || j == greater);
				
	env e;
	sinvoke remove(e,key);

	env ePost;
	/* collect post-data */
	uint256 head_ = sinvoke getHead(ePost);
	uint256 tail_ = sinvoke getTail(ePost);
	uint256 numElements_ = sinvoke getNumElements(ePost);
	
	/* post-contains */
	bool headContained_ = sinvoke contains(ePost,head_);
	bool tailContained_ = sinvoke contains(ePost,tail_);
	bool keyContained_ = sinvoke contains(ePost,key);
	bool iContained_ = sinvoke contains(ePost, i);
	bool jContained_ = sinvoke contains(ePost, j);
	
	/* post-value */
	uint256 headValue_ = sinvoke getValue(ePost,head_);
	uint256 tailValue_ = sinvoke getValue(ePost,tail_);
	uint256 keyValue_ = sinvoke getValue(ePost,key);
	uint256 iValue_ = sinvoke getValue(ePost, i);
	uint256 jValue_ = sinvoke getValue(ePost, j);
	
	// TODO: Remove invariants assertions that were previously checked
	// assert invariants hold
	assert head_ == 0 <=> numElements_ == 0, "Violated: list is empty iff num elements is 0";
	assert head_ == 0 <=> tail_ == 0, "Violated: head-tail symmetry";
	assert ((head_ != 0 && headContained_) 
			|| (tail_ != 0 && tailContained_) 
			|| (key != 0 && keyContained_)
			|| (i != 0 && iContained_)
			|| (j != 0 && jContained_)
					) => (head_ != 0 && headContained_ && tail_ != 0 && tailContained_), "head,tail are zero even though there are elements in the list";
	assert !sinvoke contains(ePost,0), "Key 0 cannot be in the list";
	
	if (iContained_) {
		assert sinvoke getElementGreater(ePost,i) == 0 <=> i == head_, "greater=0 implies element is head";
		assert sinvoke getElementLesser(ePost,i) == 0 <=> i == tail_, "lesser=0 implies element is tail";
		assert tailValue_ <= iValue_ && iValue_ <= headValue_, "violated min-max sortedness";
	}
	
	if (_iContained && _jContained && iContained_ && jContained_) {
		assert _iValue == iValue_, "i=$i that was already contained should not change its value";
		assert _jValue == jValue_, "j=$j that was already contained should not change its value";
		assert iValue_ <= jValue_ <=> _iValue <= _jValue, "Two elements that existed in the map must maintain their order"; // subsumed by the above
	}	
	
}

rule pointers_updated_insert(uint256 key, uint256 value, uint256 lesser, uint256 greater) {
	env eF;
	env e_;
		
	sinvoke insert(eF,key,value,lesser,greater);
	
	uint256 nextOfNewKey = sinvoke getElementGreater(e_,key);
	uint256 prevOfNewKey = sinvoke getElementLesser(e_,key);

	uint256 prevOfNextOfNewKey = sinvoke getElementLesser(e_,nextOfNewKey);
	uint256 nextOfPrevOfNewKey = sinvoke getElementGreater(e_,prevOfNewKey);
	
	assert nextOfNewKey != 0 => prevOfNextOfNewKey == key, "Previous of next of new key is the new key";
	assert prevOfNewKey != 0 => nextOfPrevOfNewKey == key, "Next of previous of new key is the new key";

}

rule pointers_updated_update(uint256 key, uint256 value, uint256 lesser, uint256 greater) {
	env eF;
	env e_;
		
	sinvoke update(eF,key,value,lesser,greater);
	
	uint256 nextOfNewKey = sinvoke getElementGreater(e_,key);
	uint256 prevOfNewKey = sinvoke getElementLesser(e_,key);

	uint256 prevOfNextOfNewKey = sinvoke getElementLesser(e_,nextOfNewKey);
	uint256 nextOfPrevOfNewKey = sinvoke getElementGreater(e_,prevOfNewKey);
	
	assert nextOfNewKey != 0 => prevOfNextOfNewKey == key, "Previous of next of new key is the new key";
	assert prevOfNewKey != 0 => nextOfPrevOfNewKey == key, "Next of previous of new key is the new key";
}
