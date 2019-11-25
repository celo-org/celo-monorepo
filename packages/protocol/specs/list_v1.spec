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
	// /* forall key. contains(key) => (greater(key) != 0 => contains(greater(key))) && (lesser(key) != 0 => contains(lesser(key))) */
	/* forall key. contains(key) => (greater(key) == 0 <=> key == head) && (lesser(key) == 0 <=> key == tail) */
	/* incomplete instantiation */
	if (_headContained) {
		require sinvoke getElementGreater(ePre,_head) == 0 <=> _head == _head;
		require sinvoke getElementLesser(ePre,_head) == 0 <=> _head == _tail;
	}
	if (_tailContained) {
		require sinvoke getElementGreater(ePre,_tail) == 0 <=> _tail == _head;
		require sinvoke getElementLesser(ePre,_tail) == 0 <=> _tail == _tail;
	}
	if (_keyContained) {
		require sinvoke getElementGreater(ePre,key) == 0 <=> key == _head;
		require sinvoke getElementLesser(ePre,key) == 0 <=> key == _tail;
	}
	if (_lesserContained) {
		//require greaterOfLesser != 0 => _greaterOfLesserContained /* don't need for lesser(lesserKey) */;
		require _greaterOfLesser == 0 <=> lesser == _head;
		require sinvoke getElementLesser(ePre,lesser) == 0 <=> lesser == _tail;

	}
	if (_greaterContained) {
		//require lesserOfGreater != 0 => _lesserOfGreaterContained /* don't need for lesser(lesserKey) */;
		require sinvoke getElementGreater(ePre,greater) == 0 <=> greater == _head;
		require _lesserOfGreater == 0 <=> greater == _tail;
	}
			
	env e;
	invoke insert(e,key,value,lesser,greater);

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

	assert sinvoke contains(ePost,nextOfNewKey), "New key $key next $nextOfNewKey should be contained in the list";
	assert sinvoke contains(ePost,prevOfNewKey), "New key $key previous $nextOfNewKey should be contained in the list";
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
					) => (_head != 0 && _headContained && _tail != 0 && _tailContained);
	/* !contains(0) */
	require !sinvoke contains(ePre,0);
	
// TODO: I'm getting into an instantiation loop here... will all the greater, lesser pointers
	// /* forall key. contains(key) => (greater(key) != 0 => contains(greater(key))) && (lesser(key) != 0 => contains(lesser(key))) */
	/* forall key. contains(key) => (greater(key) == 0 <=> key == head) && (lesser(key) == 0 <=> key == tail) */
	/* forall key. contains(key) => getValues(tail) <= getValue(key) <= getValue(head) */
	/* incomplete instantiation */
	if (_headContained) {
		require sinvoke getElementGreater(ePre,_head) == 0 <=> _head == _head;
		require sinvoke getElementLesser(ePre,_head) == 0 <=> _head == _tail;
		require _tailValue <= _headValue && _headValue <= _headValue;
	}
	if (_tailContained) {
		require sinvoke getElementGreater(ePre,_tail) == 0 <=> _tail == _head;
		require sinvoke getElementLesser(ePre,_tail) == 0 <=> _tail == _tail;
		require _tailValue <= _tailValue && _tailValue <= _headValue;
	}
	if (_keyContained) {
		require sinvoke getElementGreater(ePre,key) == 0 <=> key == _head;
		require sinvoke getElementLesser(ePre,key) == 0 <=> key == _tail;
		require _tailValue <= _keyValue && _keyValue <= _headValue;
	}
	if (_lesserContained) {
		//require greaterOfLesser != 0 => _greaterOfLesserContained /* don't need for lesser(lesserKey) */;
		require _greaterOfLesser == 0 <=> lesser == _head;
		require sinvoke getElementLesser(ePre,lesser) == 0 <=> lesser == _tail;
		require _tailValue <= _lesserValue && _lesserValue <= _headValue;

	}
	if (_greaterContained) {
		//require lesserOfGreater != 0 => _lesserOfGreaterContained /* don't need for lesser(lesserKey) */;
		require sinvoke getElementGreater(ePre,greater) == 0 <=> greater == _head;
		require _lesserOfGreater == 0 <=> greater == _tail;
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
	require _tailValue <= _lesserOfGreaterValue && _lesserOfGreaterValue <= _greaterValue
			&& _lesserValue <= _greaterOfLesserValue && _greaterOfLesserValue <= _headValue;
	
		
	env e;
	invoke insert(e,key,value,lesser,greater);

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
	
	// assert invariants hold
	assert head_ == 0 <=> numElements_ == 0, "Violated: list is empty iff num elements is 0";
	assert head_ == 0 <=> tail_ == 0, "Violated: head-tail symmetry";
	assert ((head_ != 0 && headContained_) 
			|| (tail_ != 0 && tailContained_) 
			|| (lesser != 0 && lesserContained_) 
			|| (greater != 0 && greaterContained_)
			|| (key != 0 && keyContained_)
			|| (i != 0 && iContained_)
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

	assert sinvoke contains(ePost,nextOfNewKey), "New key $key next $nextOfNewKey should be contained in the list";
	assert sinvoke contains(ePost,prevOfNewKey), "New key $key previous $nextOfNewKey should be contained in the list";
	assert nextOfNewKeyValue >= value, "New key $key next $nextOfNewKey value $nextOfNewKeyValue should be greater or equal to $value";
	assert prevOfNewKeyValue <= value, "New key $key previous $prevOfNewKey value $prevOfNewKeyValue value should be lesser or equal to $value";
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
		require sinvoke getElementGreater(ePre,_head) == 0 <=> _head == _head;
		require sinvoke getElementLesser(ePre,_head) == 0 <=> _head == _tail;
		require _tailValue <= _headValue && _headValue <= _headValue;
	}
	if (_tailContained) {
		require sinvoke getElementGreater(ePre,_tail) == 0 <=> _tail == _head;
		require sinvoke getElementLesser(ePre,_tail) == 0 <=> _tail == _tail;
		require _tailValue <= _tailValue && _tailValue <= _headValue;
	}
	if (_keyContained) {
		require sinvoke getElementGreater(ePre,key) == 0 <=> key == _head;
		require sinvoke getElementLesser(ePre,key) == 0 <=> key == _tail;
		require _tailValue <= _keyValue && _keyValue <= _headValue;
	}
	if (_lesserContained) {
		require _greaterOfLesser == 0 <=> lesser == _head;
		require sinvoke getElementLesser(ePre,lesser) == 0 <=> lesser == _tail;
		require _tailValue <= _lesserValue && _lesserValue <= _headValue;

	}
	if (_greaterContained) {
		require sinvoke getElementGreater(ePre,greater) == 0 <=> greater == _head;
		require _lesserOfGreater == 0 <=> greater == _tail;
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
	static_assert head_ != 0, "List is empty after insert";
	uint256 headValue_ = sinvoke getValue(ePost,head_);
	uint256 iValue_ = sinvoke getValue(ePost,i);
	static_assert (i != 0 && sinvoke contains(ePost,i)) => iValue_ <= headValue_, "head is not maximal element";
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
		require sinvoke getElementGreater(ePre,_head) == 0 <=> _head == _head;
		require sinvoke getElementLesser(ePre,_head) == 0 <=> _head == _tail;
		require _tailValue <= _headValue && _headValue <= _headValue;
	}
	if (_tailContained) {
		require sinvoke getElementGreater(ePre,_tail) == 0 <=> _tail == _head;
		require sinvoke getElementLesser(ePre,_tail) == 0 <=> _tail == _tail;
		require _tailValue <= _tailValue && _tailValue <= _headValue;
	}
	if (_keyContained) {
		require sinvoke getElementGreater(ePre,key) == 0 <=> key == _head;
		require sinvoke getElementLesser(ePre,key) == 0 <=> key == _tail;
		require _tailValue <= _keyValue && _keyValue <= _headValue;
	}
	if (_lesserContained) {
		require _greaterOfLesser == 0 <=> lesser == _head;
		require sinvoke getElementLesser(ePre,lesser) == 0 <=> lesser == _tail;
		require _tailValue <= _lesserValue && _lesserValue <= _headValue;

	}
	if (_greaterContained) {
		require sinvoke getElementGreater(ePre,greater) == 0 <=> greater == _head;
		require _lesserOfGreater == 0 <=> greater == _tail;
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
	static_assert tail_ != 0, "List is empty after insert";
	uint256 tailValue_ = sinvoke getValue(ePost,tail_);
	uint256 iValue_ = sinvoke getValue(ePost,i);
	static_assert (i != 0 && sinvoke contains(ePost,i)) => iValue_ >= tailValue_, "tail is not minimal element";

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
	static_require key != 0; 
	static_require key != lesser && key != greater && !(sinvoke contains(ePre,key));
	static_require _numElements < 115792089237316195423570985008687907853269984665640564039457584007913129639935 /* MAX-1 */;
	static_require lesser != 0 || greater != 0 || _numElements == 0;
	static_require lesser == 0 || _lesserContained;
	static_require greater == 0 || _greaterContained;
	static_require eF.msg.value == 0; // non payable

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

	static_require lesserCorrect || greaterCorrect;


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
	/* incomplete instantiation */
	if (_headContained) {
		require sinvoke getElementGreater(ePre,_head) == 0 <=> _head == _head;
		require sinvoke getElementLesser(ePre,_head) == 0 <=> _head == _tail;
		require _tailValue <= _headValue && _headValue <= _headValue;
	}
	if (_tailContained) {
		require sinvoke getElementGreater(ePre,_tail) == 0 <=> _tail == _head;
		require sinvoke getElementLesser(ePre,_tail) == 0 <=> _tail == _tail;
		require _tailValue <= _tailValue && _tailValue <= _headValue;
	}
	if (_keyContained) {
		require sinvoke getElementGreater(ePre,key) == 0 <=> key == _head;
		require sinvoke getElementLesser(ePre,key) == 0 <=> key == _tail;
		require _tailValue <= _keyValue && _keyValue <= _headValue;
	}
	if (_lesserContained) {
		require _greaterOfLesser == 0 <=> lesser == _head;
		require sinvoke getElementLesser(ePre,lesser) == 0 <=> lesser == _tail;
		require _tailValue <= _lesserValue && _lesserValue <= _headValue;

	}
	if (_greaterContained) {
		require sinvoke getElementGreater(ePre,greater) == 0 <=> greater == _head;
		require _lesserOfGreater == 0 <=> greater == _tail;
		require _tailValue <= _greaterValue && _greaterValue <= _headValue;
	}
		
	/* more sortedness assumptions */
	require _tailValue <= _lesserOfGreaterValue && _lesserOfGreaterValue <= _greaterValue
			&& _lesserValue <= _greaterOfLesserValue && _greaterOfLesserValue <= _headValue;
	
	
/*		
	// forall key. contains(key) => (greater(key) == 0 <=> key == head) 
	static_require lesserKey != 0 && sinvoke contains(ePre,lesserKey) => (sinvoke getElementGreater(ePre,lesserKey) == 0 <=> lesserKey == head);
	// forall key. contains(key) => (lesser(key) == 0 <=> key == tail) 
	static_require greaterKey != 0 && sinvoke contains(ePre,greaterKey) => (sinvoke getElementLesser(ePre,greaterKey) == 0 <=> greaterKey == tail);
	// Instantiate the above for head, tail specifically (will simplify it) 
	static_require head != 0 => (sinvoke getElementGreater(ePre,head) == 0);
	static_require tail != 0 => (sinvoke getElementLesser(ePre,tail) == 0);

	uint256 lessersGreater = sinvoke getElementGreater(ePre, lesserKey);
	uint256 greatersLesser = sinvoke getElementLesser(ePre, greaterKey);
	// forall key. contains(key) => (greater(key) != 0 => contains(greater(key))) && (lesser(key) != 0 => contains(lesser(key))) 
	static_require sinvoke contains(ePre,lesserKey) => (lessersGreater != 0 => sinvoke contains(ePre,lessersGreater));
	static_require sinvoke contains(ePre,greaterKey) => (greatersLesser != 0 => sinvoke contains(ePre,greatersLesser));
	
	// forall key. contains(key) => (greater(key) != 0 => key <= greater(key)) && (lesser(key) != 0 => key >= lesser(key)) 
	static_require sinvoke contains(ePre,lesserKey) => ((lessersGreater != 0 => sinvoke getValue(ePre,lesserKey) <= sinvoke getValue(ePre,lessersGreater)) &&
														(greatersLesser != 0 => sinvoke getValue(ePre,greaterKey) <= sinvoke getValue(ePre,greatersLesser)));
		
	// forall key1,key2. contains(key1) && contains(key2) => greater(key1) == key2 <=> lesser(key2) == key1 
	// here: simplified	
	static_require lesserCorrect => sinvoke getElementLesser(ePre, lessersGreater) == lesserKey;
	static_require greaterCorrect => sinvoke getElementGreater(ePre, greatersLesser) == greaterKey;
	*/
	
	invoke insert(eF, key, value, lesser, greater);
	bool insertSucceeded = !lastReverted;
	
	static_assert insertSucceeded, "insert did not succeed";
	static_assert sinvoke contains(ePost,key), "new key $key must be contained";
	uint256 actualNewValue = sinvoke getValue(ePost,key);
	static_assert actualNewValue == value, "inserted a different value, expected $value but got $actualNewValue";
}

/*
rule sortedness_remove(uint256 i, uint256 j)
{
	env ePre; havoc ePre;
	env ePost; havoc ePost;
	env eF; havoc eF;
	
	// first make sure i,j are in the list
	static_require sinvoke contains(ePre,i);
	static_require sinvoke contains(ePre,j);
	
	uint256 valI = sinvoke getValue(ePre,i);
	uint256 valJ = sinvoke getValue(ePre,j);
	
	static_require valI <= valJ;
	
	uint256 arg1;
	static_require arg1 != i && arg1 != j; // not removing i or j
	invoke remove(eF, arg1);
	
	uint256 valI_ = sinvoke getValue(ePost,i);
	uint256 valJ_ = sinvoke getValue(ePost,j);
	
	static_assert sinvoke contains(ePost,i), "i=$i removed from list";
	static_assert sinvoke contains(ePost,j), "j=$j removed from list";
	static_assert valI_ <= valJ_, "Not sorted";
}

rule sortedness_update(uint256 i, uint256 j)
{
	env ePre; havoc ePre;
	env ePost; havoc ePost;
	env eF; havoc eF;
	
	// first make sure i,j are in the list
	static_require sinvoke contains(ePre,i);
	static_require sinvoke contains(ePre,j);
	
	uint256 valI = sinvoke getValue(ePre,i);
	uint256 valJ = sinvoke getValue(ePre,j);
	
	static_require valI <= valJ;
	
	uint256 arg1; uint256 arg2; uint256 arg3; uint256 arg4;
	static_require valI <= arg2 && arg2 <= valJ; // new value does not break the order
	invoke update(eF, arg1, arg2, arg3, arg4);
	
	uint256 valI_ = sinvoke getValue(ePost,i);
	uint256 valJ_ = sinvoke getValue(ePost,j);
	
	static_assert sinvoke contains(ePost,i), "i=$i removed from list";
	static_assert sinvoke contains(ePost,j), "j=$j removed from list";
	static_assert valI_ <= valJ_, "Not sorted";
}*/


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

	static_assert (iContained_ <=> _iContained) || i == newKey, "Violated: Any previous element $i in the list is still in the list, any element not previously in the list is not in the list (with the exception of new key $newKey)";
	static_assert i != newKey => _iValue == iValue_, "Violated: Any element $i except for new key $newKey should have exactly the same value returned by getValue";
	static_assert i == newKey => iValue_ == newValue, "Violated: New element $i has an unexpected value";
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

	static_assert iContained_ <=> _iContained && i != removedKey, "Violated: Any previous element $i in the list is still in the list, any element not previously in the list is not in the list (with the exception of removed key $removedKey)";
	static_assert i != removedKey => _iValue == iValue_, "Violated: Any element $i except for removed key $removedKey should have exactly the same value returned by getValue";
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

	static_assert iContained_ <=> _iContained, "Violated: Any previous element $i in the list is still in the list, any element not previously in the list is not in the list";
	static_assert i != updatedKey => _iValue == iValue_, "Violated: Any element $i except for the updated key $updatedKey has the same value";
	static_assert i == updatedKey => iValue_ == updatedValue, "Violated: Updated element $i has an unexpected value";

}
